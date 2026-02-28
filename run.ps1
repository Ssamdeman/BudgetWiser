param(
    [Parameter(Position = 0, Mandatory = $false)]
    [ValidateSet("update", "add-data", "dev", "help")]
    [string]$Task = "help",

    [string]$File
)

switch ($Task) {
    "help" {
        Write-Host "Available Tasks:" -ForegroundColor Cyan
        Write-Host "  dev       - Starts the Next.js dev server"
        Write-Host "  genkit    - Starts the Genkit watch process"
        Write-Host "  update    - Runs 'repomix --style xml' (from Makefile)"
        Write-Host "  add-data  - Consolidates V2 data using consolidate_v2.py."
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\run.ps1 dev"
        Write-Host "  .\run.ps1 add-data -File path/to/monthly-data.csv"
    }

    "dev" {
        Write-Host "Starting Next.js..." -ForegroundColor Green
        npm run dev
    }

    "genkit" {
        Write-Host "Starting Genkit watch process..." -ForegroundColor Green
        npm run genkit:watch
    }

    "update" {
        Write-Host "Running repomix..." -ForegroundColor Green
        repomix --style xml
    }

    "add-data" {
        if (-not $File) {
            Write-Error "Error: -File parameter is required for add-data"
            Write-Host "Usage: .\run.ps1 add-data -File <path_to_csv>" -ForegroundColor Yellow
            exit 1
        }
        
        $PythonScript = "public\consolidate_v2.py"
        $OutputFile = "public\V2_master_finances-2026.csv"
        
        if (-not (Test-Path $File)) {
            Write-Error "Error: Input file '$File' not found."
            exit 1
        }
        
        Write-Host "Processing data from '$File'..." -ForegroundColor Green
        
        # Execute the python script with the required flags
        python $PythonScript $File --output $OutputFile --append
    }
}
