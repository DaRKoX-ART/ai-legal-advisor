param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths
)

Add-Type -AssemblyName System.Drawing

foreach ($p in $Paths) {
    if (-not (Test-Path $p)) {
        Write-Error "Missing: $p"
        continue
    }

    $img = [System.Drawing.Image]::FromFile((Resolve-Path $p).Path)
    try {
        $w = $img.Width
        $h = $img.Height
        if ($w -eq $h) {
            Write-Host "Already square: $p ($w x $h)"
            continue
        }

        $size = [Math]::Max($w, $h)
        $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        try {
            $g.Clear([System.Drawing.Color]::Transparent)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $x = [int](($size - $w) / 2)
            $y = [int](($size - $h) / 2)
            $g.DrawImage($img, $x, $y, $w, $h)
        } finally {
            $g.Dispose()
        }

        $img.Dispose()
        $img = $null

        $tmp = "$p.tmp.png"
        $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()

        Move-Item -Force $tmp $p
        Write-Host "Padded to ${size}x${size}: $p"
    } finally {
        if ($img) { $img.Dispose() }
    }
}
