# Create test directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "./test/geometry"

# Get all TypeScript files from src/geometry
Get-ChildItem -Path "./src/geometry" -Filter "*.ts" -Recurse | ForEach-Object {
    # Skip index files and files in subdirectories
    if ($_.Name -ne "index.ts" -and $_.Directory.Name -eq "geometry") {
        $testFileName = $_.Name -replace "\.ts$", ".test.ts"
        $testFilePath = "./test/geometry/$testFileName"
        
        # Create test file if it doesn't exist
        if (-not (Test-Path $testFilePath)) {
            $className = $_.Name -replace "\.ts$", ""
            $testContent = @"
import { describe, it, expect } from 'vitest'
import { $className } from '../../src/geometry/$($_.Name)'

describe('$className', () => {
    // Tests will be added here
})
"@
            Set-Content -Path $testFilePath -Value $testContent
            Write-Host "Created test file: $testFilePath"
        }
    }
}