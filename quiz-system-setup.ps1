# HeroStudy AI - Quiz System Setup Script
param (
    [string]$ProjectRoot = (Get-Location)
)

# Define directories
$srcDir = Join-Path $ProjectRoot "src"
$libDir = Join-Path $srcDir "lib"
$aiDir = Join-Path $libDir "ai"
$quizDir = Join-Path $aiDir "quiz"
$componentsDir = Join-Path $srcDir "components"
$quizComponentsDir = Join-Path $componentsDir "quiz"
$apiDir = Join-Path $srcDir "app/api"
$quizApiDir = Join-Path $apiDir "learning/quiz"
$typesDir = Join-Path $srcDir "types"
$pageDir = Join-Path $srcDir "app/dashboard/quiz"
$generateDir = Join-Path $pageDir "generate"
$idDir = Join-Path $pageDir "[id]"

# Create all directories
$directories = @(
    $srcDir, $libDir, $aiDir, $quizDir, $componentsDir, $quizComponentsDir, 
    $apiDir, $quizApiDir, $typesDir, (Join-Path $quizApiDir "generate"),
    (Join-Path $quizApiDir "evaluate"), (Join-Path $quizApiDir "analytics"),
    $pageDir, $generateDir, $idDir
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating directory: $dir" -ForegroundColor Cyan
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
    else {
        Write-Host "Directory already exists: $dir" -ForegroundColor Yellow
    }
}

# Create firebase-config.ts
$firebaseConfigFile = Join-Path $libDir "firebase-config.ts"
if (-not (Test-Path $firebaseConfigFile)) {
    Write-Host "Creating firebase-config.ts" -ForegroundColor Cyan
    Set-Content -Path $firebaseConfigFile -Value "// Firebase configuration placeholder" -Encoding UTF8
}
else {
    Write-Host "firebase-config.ts already exists" -ForegroundColor Yellow
}

# Define all files to create
$allFiles = @(
    # Types
    "$typesDir\quiz.ts",
    
    # AI Service
    "$quizDir\types.ts",
    "$quizDir\generator.ts",
    "$quizDir\evaluator.ts",
    "$quizDir\analytics.ts",
    "$quizDir\index.ts",
    
    # Components
    "$quizComponentsDir\AdaptiveQuiz.tsx",
    "$quizComponentsDir\QuizQuestion.tsx",
    "$quizComponentsDir\QuizResults.tsx",
    "$quizComponentsDir\QuizGenerator.tsx",
    
    # API Routes
    "$quizApiDir\generate\route.ts",
    "$quizApiDir\evaluate\route.ts",
    "$quizApiDir\analytics\route.ts",
    
    # Pages
    "$pageDir\page.tsx",
    "$generateDir\page.tsx",
    "$idDir\page.tsx"
)

# Create all files
foreach ($file in $allFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Creating file: $file" -ForegroundColor Cyan
        New-Item -Path $file -ItemType File -Force | Out-Null
    }
    else {
        Write-Host "File already exists: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nQuiz System setup completed successfully!" -ForegroundColor Green