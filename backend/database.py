import os
import json
import ssl
from pathlib import Path
from typing import Optional
from contextlib import contextmanager
import pyexasol
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

def get_db_credentials() -> dict:
    """Retrieve Exasol connection credentials safely from env or fallback file."""
    dsn = os.getenv("EXASOL_DSN", "127.0.0.1:8563")
    user = os.getenv("EXASOL_USER", "sys")
    schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
    encryption = os.getenv("EXASOL_ENCRYPTION", "True").lower() in ("true", "1", "yes")
    password = os.getenv("EXASOL_PASSWORD")

    # Safe fallback to local Exasol Personal secrets if password not provided in env
    if not password:
        secrets_path = Path(r"C:\Users\balak\.exasol\personal\deployments\default\secrets.json")
        if secrets_path.exists():
            try:
                with open(secrets_path, "r", encoding="utf-8") as f:
                    secrets = json.load(f)
                    password = secrets.get("admin-password")
            except Exception:
                pass

    if not password:
        password = "exasol"  # Standard default fallback

    return {
        "dsn": dsn,
        "user": user,
        "password": password,
        "schema": schema,
        "encryption": encryption,
        "websocket_sslopt": {"cert_reqs": ssl.CERT_NONE, "check_hostname": False},
        "connection_timeout": 10,
        "socket_timeout": 30
    }

@contextmanager
def get_db_connection():
    """Context manager for acquiring an Exasol connection."""
    creds = get_db_credentials()
    conn = None
    try:
        conn = pyexasol.connect(**creds)
        yield conn
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

def test_db_connection() -> dict:
    """Test connection and return status and version metadata."""
    try:
        with get_db_connection() as conn:
            res = conn.export_to_pandas("""
                SELECT 
                    PARAM_VALUE AS DB_VERSION 
                FROM SYS.EXA_METADATA 
                WHERE PARAM_NAME = 'databaseProductVersion'
            """)
            version = res["DB_VERSION"].iloc[0] if not res.empty else "Exasol Personal"
            return {
                "connected": True,
                "dsn": os.getenv("EXASOL_DSN", "127.0.0.1:8563"),
                "schema": os.getenv("EXASOL_SCHEMA", "CLOSEWISE"),
                "version": str(version),
                "error": None
            }
    except Exception as e:
        return {
            "connected": False,
            "dsn": os.getenv("EXASOL_DSN", "127.0.0.1:8563"),
            "schema": os.getenv("EXASOL_SCHEMA", "CLOSEWISE"),
            "version": None,
            "error": str(e)
        }

def initialize_database():
    """
    Safely initialize application tables without touching existing source tables.
    Preserves CLOSEWISE.BANK_TRANSACTIONS and CLOSEWISE.LEDGER_TRANSACTIONS.
    """
    with get_db_connection() as conn:
        schema = os.getenv("EXASOL_SCHEMA", "CLOSEWISE")
        
        # 1. Run Registry Table
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {schema}.LEDGERLENS_RUNS (
                RUN_ID VARCHAR(64) PRIMARY KEY,
                RUN_TYPE VARCHAR(32),
                SOURCE_NAME VARCHAR(128),
                BANK_RECORD_COUNT DECIMAL(9,0),
                LEDGER_RECORD_COUNT DECIMAL(9,0),
                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. Bank Staging Table (for user-uploaded CSV batches)
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {schema}.LEDGERLENS_BANK_STAGING (
                RUN_ID VARCHAR(64),
                BANK_ID VARCHAR(64),
                REFERENCE VARCHAR(100),
                TXN_DATE DATE,
                AMOUNT DECIMAL(15,2),
                CURRENCY VARCHAR(10),
                DESCRIPTION VARCHAR(255),
                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 3. Ledger Staging Table (for user-uploaded CSV batches)
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {schema}.LEDGERLENS_LEDGER_STAGING (
                RUN_ID VARCHAR(64),
                LEDGER_ID VARCHAR(64),
                REFERENCE VARCHAR(100),
                TXN_DATE DATE,
                AMOUNT DECIMAL(15,2),
                CURRENCY VARCHAR(10),
                DESCRIPTION VARCHAR(255),
                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 4. Exception Reviews Status Table
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {schema}.LEDGERLENS_REVIEWS (
                RUN_ID VARCHAR(64),
                REFERENCE VARCHAR(100),
                REVIEW_STATUS VARCHAR(32) DEFAULT 'UNREVIEWED',
                REVIEWER_NOTE VARCHAR(2000),
                REVIEWER_ID VARCHAR(128),
                UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (RUN_ID, REFERENCE)
            )
        """)

        # 5. Review History Audit Log Table
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {schema}.LEDGERLENS_REVIEW_HISTORY (
                HISTORY_ID VARCHAR(64) PRIMARY KEY,
                RUN_ID VARCHAR(64),
                REFERENCE VARCHAR(100),
                OLD_STATUS VARCHAR(32),
                NEW_STATUS VARCHAR(32),
                NOTE VARCHAR(2000),
                REVIEWER_ID VARCHAR(128),
                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 6. Ensure default run metadata exists in LEDGERLENS_RUNS
        existing_default = conn.export_to_pandas(f"""
            SELECT COUNT(*) AS CNT FROM {schema}.LEDGERLENS_RUNS WHERE RUN_ID = 'DEFAULT'
        """)
        if existing_default["CNT"].iloc[0] == 0:
            bank_count = conn.export_to_pandas(f"SELECT COUNT(*) AS CNT FROM {schema}.BANK_TRANSACTIONS")["CNT"].iloc[0]
            ledger_count = conn.export_to_pandas(f"SELECT COUNT(*) AS CNT FROM {schema}.LEDGER_TRANSACTIONS")["CNT"].iloc[0]
            conn.execute(f"""
                INSERT INTO {schema}.LEDGERLENS_RUNS (RUN_ID, RUN_TYPE, SOURCE_NAME, BANK_RECORD_COUNT, LEDGER_RECORD_COUNT)
                VALUES ('DEFAULT', 'SYNTHETIC_DEFAULT', 'Exasol Standard CloseWise Source', {bank_count}, {ledger_count})
            """)

if __name__ == "__main__":
    status = test_db_connection()
    print("DB Connection Status:", status)
    if status["connected"]:
        initialize_database()
        print("Database initialized successfully.")
