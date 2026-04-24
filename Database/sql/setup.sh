#!/bin/bash
# ==============================================================
# setup.sh
# Master script to build the agriculture_intelligente database
# from scratch in the correct order.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# Requirements:
#   - PostgreSQL installed and running
#   - psql available in PATH
#   - Run from the same directory as the SQL files
# ==============================================================

set -e  # Stop immediately if any command fails

# --------------------------------------------------------------
# CONFIGURATION — edit these before running
# --------------------------------------------------------------
PG_SUPERUSER="neondb_owner"
PG_HOST="ep-orange-union-a4qw3jix-pooler.us-east-1.aws.neon.tech"
PG_PORT="5432"
DB_NAME="agriculture_intelligente"
MIGRATION_USER="neondb_owner"
MIGRATION_PASS="npg_UsYKh82OMXHr"

DB_URL="postgresql://$PG_SUPERUSER:$MIGRATION_PASS@$PG_HOST:$PG_PORT/$DB_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --------------------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------------------
log_info()    { echo -e "${YELLOW}[INFO]${NC}  $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

run_as_superuser() {
    local file=$1
    log_info "Running $file as superuser ($PG_SUPERUSER)..."
    PGPASSWORD="$MIGRATION_PASS" psql \
      "host=$PG_HOST port=$PG_PORT dbname=$DB_NAME user=$PG_SUPERUSER sslmode=require" \
      -f "$file" \
      || log_error "Failed on $file"
    log_success "$file completed."
}

run_as_migration() {
    local file=$1
    log_info "Running $file as migration user ($MIGRATION_USER)..."
    PGPASSWORD="$MIGRATION_PASS" psql \
        -U "$MIGRATION_USER" \
        -h "$PG_HOST" \
        -p "$PG_PORT" \
        -d "$DB_NAME" \
        -f "$file" \
        || log_error "Failed on $file"
    log_success "$file completed."
}

# --------------------------------------------------------------
# PRE-FLIGHT CHECKS
# --------------------------------------------------------------
log_info "Checking psql availability..."
command -v psql &>/dev/null || log_error "psql not found. Install PostgreSQL first."
log_success "psql found."

log_info "Checking SQL files..."
for f in \
    00_create_database.sql \
    00_reset.sql \
    01_extensions.sql \
    02_enums.sql \
    03_tables.sql \
    04_indexes.sql \
    05_views.sql \
    06_triggers.sql \
    07_sample_data.sql \
    08_permissions.sql; do
    [ -f "$f" ] || log_error "Missing file: $f"
done
log_success "All SQL files found."

# --------------------------------------------------------------
# STEP 1 — Create database and roles (superuser required)
# --------------------------------------------------------------
echo ""
log_info "====== STEP 1: Creating database and roles ======"
#run_as_superuser "00_create_database.sql"

# --------------------------------------------------------------
# STEP 2 — Reset any existing objects (clean slate)
# --------------------------------------------------------------
echo ""
log_info "====== STEP 2: Resetting existing objects ======"
run_as_migration "00_reset.sql"

# --------------------------------------------------------------
# STEP 3 — Extensions
# --------------------------------------------------------------
echo ""
log_info "====== STEP 3: Installing extensions ======"
run_as_migration "01_extensions.sql"

# --------------------------------------------------------------
# STEP 4 — Enums
# --------------------------------------------------------------
echo ""
log_info "====== STEP 4: Creating enums ======"
run_as_migration "02_enums.sql"

# --------------------------------------------------------------
# STEP 5 — Tables
# --------------------------------------------------------------
echo ""
log_info "====== STEP 5: Creating tables ======"
run_as_migration "03_tables.sql"

# --------------------------------------------------------------
# STEP 6 — Indexes
# --------------------------------------------------------------
echo ""
log_info "====== STEP 6: Creating indexes ======"
run_as_migration "04_indexes.sql"

# --------------------------------------------------------------
# STEP 7 — Views
# --------------------------------------------------------------
echo ""
log_info "====== STEP 7: Creating views ======"
run_as_migration "05_views.sql"

# --------------------------------------------------------------
# STEP 8 — Triggers
# --------------------------------------------------------------
echo ""
log_info "====== STEP 8: Creating triggers ======"
run_as_migration "06_triggers.sql"

# --------------------------------------------------------------
# STEP 9 — Sample data
# --------------------------------------------------------------
echo ""
log_info "====== STEP 9: Inserting sample data ======"
read -p "$(echo -e ${YELLOW}Insert sample data? This is for development only. [y/N]:${NC} )" confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
    run_as_migration "07_sample_data.sql"
else
    log_info "Skipped sample data."
fi

# --------------------------------------------------------------
# STEP 10 — Permissions
# --------------------------------------------------------------
echo ""
log_info "====== STEP 10: Setting permissions ======"
run_as_superuser "08_permissions.sql"

# --------------------------------------------------------------
# DONE
# --------------------------------------------------------------
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Database setup completed successfully!   ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Database : $DB_NAME"
echo "  App user : agri_app"
echo "  Host     : $PG_HOST:$PG_PORT"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  1. Replace placeholder password hashes in 07_sample_data.sql"
echo "  2. Change role passwords before going to production"
echo "  3. Update your backend .env with the agri_app credentials"
echo ""
