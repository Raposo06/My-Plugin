<#
.SYNOPSIS
  Builds foxcore.plugin from foxcore-plugin/.

.DESCRIPTION
  For each extension under foxcore-plugin/extensions/ (any folder with a
  package.json and server/index.js):
    1. npm install       - resolve deps so esbuild can bundle them
    2. esbuild            - bundle server/index.js -> server/main.mjs,
                             inlining all npm dependencies into one file
    3. remove node_modules - keep it out of the zip entirely

  Then zips foxcore-plugin/ into foxcore.plugin at the repo root, and
  verifies the result has no node_modules/ entries and no "@"-scoped
  package paths (Claude's plugin loader rejects zips containing either -
  see README.md "Building & packaging" section for why).

  Remember: the plugin runs from Claude's REMOTE upload, not this local
  folder. Rebuilding does nothing until you re-upload foxcore.plugin.

.EXAMPLE
  .\build-plugin.ps1
#>

$ErrorActionPreference = 'Stop'

$root          = $PSScriptRoot
$pluginDir     = Join-Path $root 'foxcore-plugin'
$extensionsDir = Join-Path $pluginDir 'extensions'
$outputZip     = Join-Path $root 'foxcore.plugin'
$esbuildBanner = "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

if (-not (Test-Path $pluginDir)) {
    throw "foxcore-plugin/ not found next to this script at $root"
}

$extensions = Get-ChildItem $extensionsDir -Directory | Where-Object {
    (Test-Path (Join-Path $_.FullName 'package.json')) -and
    (Test-Path (Join-Path $_.FullName 'server\index.js'))
}

foreach ($ext in $extensions) {
    Write-Output "=== Bundling $($ext.Name) ==="
    Push-Location $ext.FullName
    try {
        npm install --no-fund --no-audit 2>&1 | Out-Null

        npx --yes esbuild server/index.js `
            --bundle --platform=node --format=esm --target=node18 `
            --banner:js=$esbuildBanner `
            --outfile=server/main.mjs

        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    }
    finally {
        Pop-Location
    }
}

Write-Output "=== Zipping plugin ==="
Compress-Archive -Path "$pluginDir\*" -DestinationPath $outputZip -Force

# --- Verify ---
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($outputZip)
try {
    $entries = $zip.Entries | ForEach-Object { $_.FullName }
    $atPaths = $entries | Where-Object { $_ -like '*@*' }
    $nodeModules = $entries | Where-Object { $_ -like '*node_modules*' }

    Write-Output ""
    Write-Output "Built: $outputZip ($((Get-Item $outputZip).Length) bytes, $($entries.Count) entries)"

    if ($atPaths) {
        Write-Warning "Zip contains @-scoped paths - will likely fail 'invalid characters' check on upload:"
        $atPaths | ForEach-Object { Write-Warning "  $_" }
    }
    if ($nodeModules) {
        Write-Warning "Zip still contains node_modules entries:"
        $nodeModules | Select-Object -First 5 | ForEach-Object { Write-Warning "  $_" }
    }
    if (-not $atPaths -and -not $nodeModules) {
        Write-Output "Clean: no @-scoped paths, no node_modules."
    }
}
finally {
    $zip.Dispose()
}

Write-Output ""
Write-Output "Next step: re-upload foxcore.plugin in Claude (it runs from the remote copy, not this folder)."
