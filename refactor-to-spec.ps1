# Define the base directory relative to the script's location
$baseDir = Join-Path (Get-Location) "src\geometry"
$refSystemDir = Join-Path $baseDir "referencesystems"

# Create the directories if they don't exist
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Force -Path $baseDir
}
if (-not (Test-Path $refSystemDir)) {
    New-Item -ItemType Directory -Force -Path $refSystemDir
}

# Define class details with inheritance and composition
$classDefinitions = @(
    @{ Name = "Geometry.ts"; Inherits = ""; Contains = "" }
    @{ Name = "Point.ts"; Inherits = "Geometry"; Contains = "" }
    @{ Name = "Curve.ts"; Inherits = "Geometry"; Contains = "" }
    @{ Name = "LineString.ts"; Inherits = "Curve"; Contains = "Point (2..*)" }
    @{ Name = "Line.ts"; Inherits = "LineString"; Contains = "" }
    @{ Name = "LinearRing.ts"; Inherits = "LineString"; Contains = "" }
    @{ Name = "Surface.ts"; Inherits = "Geometry"; Contains = "" }
    @{ Name = "Polygon.ts"; Inherits = "Surface"; Contains = "LinearRing (1..*)" }
    @{ Name = "Triangle.ts"; Inherits = "Polygon"; Contains = "LinearRing (1..*)" }
    @{ Name = "PolyhedralSurface.ts"; Inherits = "Surface"; Contains = "Polygon (1..*)" }
    @{ Name = "TIN.ts"; Inherits = "PolyhedralSurface"; Contains = "Triangle (1..*)" }
    @{ Name = "GeometryCollection.ts"; Inherits = "Geometry"; Contains = "" }
    @{ Name = "MultiPoint.ts"; Inherits = "GeometryCollection"; Contains = "Point (0..*)" }
    @{ Name = "MultiCurve.ts"; Inherits = "GeometryCollection"; Contains = "Curve (0..*)" }
    @{ Name = "MultiSurface.ts"; Inherits = "GeometryCollection"; Contains = "Surface (0..*)" }
    @{ Name = "MultiLineString.ts"; Inherits = "GeometryCollection"; Contains = "LineString (0..*)" }
    @{ Name = "MultiPolygon.ts"; Inherits = "GeometryCollection"; Contains = "Polygon (0..*)" }
    @{ Name = "ReferenceSystem.ts"; Inherits = ""; Contains = ""; Path = $refSystemDir }
    @{ Name = "SpatialReferenceSystem.ts"; Inherits = ""; Contains = ""; Path = $refSystemDir }
    @{ Name = "MeasureReferenceSystem.ts"; Inherits = ""; Contains = ""; Path = $refSystemDir }
)

# Loop through each class definition and create the file
foreach ($class in $classDefinitions) {
    $filePath = Join-Path $(if ($class.Path) {$class.Path} else {$baseDir}) $class.Name
    $content = "export class $($class.Name.Replace('.ts', ''))"

    if ($class.Inherits) {
        $content += " extends $($class.Inherits)"
    }

    $content += " {`n    constructor() {"
    
    if ($class.Inherits) {
        $content += "`n        super();"
    }

    if ($class.Contains) {
        $containsType = $class.Contains.Split(" ")[0]
        $isArray = $class.Contains.Contains("0..*") -or $class.Contains.Contains("1..*")
        $fieldName = $containsType.ToLower() + "s"
        $content += "`n        this.$fieldName = new Array<$containsType>();"
    }

    $content += "`n    }`n}"

    # Write the file
    Set-Content -Path $filePath -Value $content
    Write-Host "File created: $filePath"
}
