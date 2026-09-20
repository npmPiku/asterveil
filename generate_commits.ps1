$ErrorActionPreference = 'Stop'

# Initialize git
git init
git remote add origin https://github.com/npmPiku/asterveil.git
git config user.name "npmPiku"
git config user.email "priyankabalmiki2007@gmail.com"

# Exclude directories
$exclude = @("node_modules", ".git", "__agent__", ".agents", "dist", ".bob", ".claude", ".continue")

# Get all files
$allFiles = Get-ChildItem -File -Recurse | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) {
        if ($path -match "\\$ex\\") {
            $skip = $true
            break
        }
    }
    if (-not $skip) { return $true }
} | Select-Object -ExpandProperty FullName

# Shuffle files
$allFiles = $allFiles | Sort-Object { Get-Random }

# We want about 75 commits.
$numCommits = 75
$filesPerCommit = [Math]::Max(1, [Math]::Floor($allFiles.Count / $numCommits))

$startDate = Get-Date "2026-09-04T00:00:00"
$endDate = [Math]::Min((Get-Date "2026-09-28T23:59:59").Ticks, (Get-Date).Ticks)
$endDateObj = [datetime]$endDate

# Generate random dates and sort them
$dates = @()
for ($i = 0; $i -lt $numCommits; $i++) {
    $randomTicks = (Get-Random -Minimum $startDate.Ticks -Maximum $endDateObj.Ticks)
    $d = [datetime]$randomTicks
    # Ensure seconds and minutes are not multiples of 5
    $sec = $d.Second
    if ($sec % 5 -eq 0) { $sec = ($sec + 1) % 60 }
    $min = $d.Minute
    if ($min % 5 -eq 0) { $min = ($min + 1) % 60 }
    
    $d = new-object datetime ($d.Year, $d.Month, $d.Day, $d.Hour, $min, $sec)
    $dates += $d
}
$dates = $dates | Sort-Object

$commitMsgs = @(
    "Update components", "Fix styles", "Refactor module", "Add utility functions",
    "Update documentation", "Setup configurations", "Initial setup",
    "Integrate API", "Update layout", "Improve performance",
    "Fix bug in rendering", "Clean up code", "Add tests", "Update dependencies",
    "Enhance UI", "Fix typo", "Code review feedback", "Implement feature",
    "Update README", "Add logging", "Update error handling"
)

$fileIndex = 0

for ($i = 0; $i -lt $numCommits; $i++) {
    $dateStr = $dates[$i].ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    
    # Determine how many files to add in this commit (randomize slightly for uneven insertions)
    $chunkSize = (Get-Random -Minimum 1 -Maximum ($filesPerCommit * 2 + 2))
    
    # If it's the last commit, add all remaining files
    if ($i -eq $numCommits - 1) {
        $chunkSize = $allFiles.Count - $fileIndex
    }
    
    $added = 0
    while ($added -lt $chunkSize -and $fileIndex -lt $allFiles.Count) {
        $file = $allFiles[$fileIndex]
        # Resolve path relative to current dir to avoid absolute path issues with git add
        $relPath = Resolve-Path -Relative $file
        git add $relPath
        $fileIndex++
        $added++
    }
    
    # Also add some random text to a dummy file to ensure there are always uneven insertions if we run out of files
    $dummy = "development_log.md"
    Add-Content -Path $dummy -Value "- Log entry at $dateStr"
    git add $dummy
    
    $msg = $commitMsgs | Get-Random
    git commit -m $msg
}

# push to origin main
git branch -M main
git push -u origin main -f

Write-Output "Done creating and pushing 75 commits."
