.PHONY: update add-data

update:
	repomix --style xml

# Usage: make add-data FILE=path/to/monthly-data.csv
add-data:
ifndef FILE
	@echo "Error: FILE is required"
	@echo "Usage: make add-data FILE=path/to/monthly-data.csv"
	@exit 1
endif
	python public/consolidate_v2.py $(FILE) -o public/V2-2026-Mastered-data/V2_master_finances-2026.csv --append

##Use case:  make add-data FILE=public/RawDataV2/