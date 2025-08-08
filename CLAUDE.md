# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PostgreSQL duplicate data management system built with FastAPI. It detects and manages duplicate reception data records through a web interface, allowing administrators to view, filter, and delete duplicate entries.

## Common Commands

### Application Startup
```bash
# Primary method - uses development configuration with auto-reload
python run.py

# Alternative method - direct execution
cd app && python main.py
```

### Dependencies
```bash
# Install all required packages
pip install -r requirements.txt
```

### Health Check
```bash
# Test database connection and app health
curl http://localhost:8000/health
```

## Architecture

### Database Layer
- **database.py**: PostgreSQL connection management using psycopg2 with context managers
- Environment-driven configuration via `.env` file
- Connection pooling through DatabaseManager singleton

### API Structure
- **main.py**: FastAPI application with CORS, static files, and route registration
- **api/**: RESTful endpoints organized by functionality:
  - `reception_data.py`: Data retrieval and pagination
  - `duplicates.py`: Duplicate detection algorithms
  - `operations.py`: Delete operations and metadata
- **models/**: Pydantic models for request/response validation
- **services/**: Business logic layer with three core services:
  - `data_service.py`: Data querying and filtering
  - `duplicate_service.py`: Duplicate detection algorithms (exact, content, status)
  - `delete_service.py`: Logical deletion operations

### Frontend Integration
- **static/**: CSS and JavaScript for responsive web interface
- **templates/**: Jinja2 HTML templates
- Client-side filtering, pagination, and batch operations

## Key Technical Details

### Duplicate Detection Types
1. **exact**: Matches on both reception content (rdata) and execution state
2. **content**: Matches only on reception content (rdata)
3. **status**: Matches only on execution state

### Database Schema
The application works with these main tables:
- `recepthead`: Reception header data with timestamps and IDs
- `receptbody`: Reception content data
- `exechead`/`execbody`: Execution data and status
- `m_ctitem`: Master data for dropdowns
- `m_emp`: Employee data

### Environment Configuration
Required `.env` variables:
- Database: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`
- Application: `APP_HOST`, `APP_PORT`, `APP_DEBUG`

## API Endpoints

- `GET /api/reception-data`: Paginated data retrieval with filtering
- `GET /api/duplicates/{type}`: Duplicate detection (exact/content/status)
- `POST /api/delete-duplicates`: Batch logical deletion
- `GET /api/metadata`: Master data for filters

## Development Notes

- The application uses logical deletion (setting `receptmoddt`) rather than physical deletion
- All database queries include timezone conversion to 'Asia/Tokyo'
- Complex duplicate detection uses window functions for efficient grouping
- Frontend uses vanilla JavaScript with modular file organization