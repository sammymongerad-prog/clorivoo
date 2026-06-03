# Test complet du systeme email Clorivo
# Lance: .\test-emails.ps1

$BASE = "https://vcptpgmsxwynbobsmmdd.supabase.co"
$KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcHRwZ21zeHd5bmJvYnNtbWRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDEzODgyMywiZXhwIjoyMDk1NzE0ODIzfQ.ZASWKB_RU16Z8U3XNjiU-kT5NmE_cDUokjhT_lmkYFU"
$H    = @{ "Authorization" = "Bearer $KEY"; "Content-Type" = "application/json"; "apikey" = $KEY }

function Test-Step($name, $url, $body) {
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    try {
        $r = Invoke-WebRequest -Method POST $url -Headers $H -Body ($body | ConvertTo-Json -Depth 10) -UseBasicParsing
        $content = $r.Content | ConvertFrom-Json
        if ($content.ok) {
            Write-Host "SUCCES" -ForegroundColor Green
        } else {
            Write-Host "Reponse: $($r.Content)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 1. Recuperer un vrai utilisateur depuis la DB
Write-Host "`n>>> Recuperation d'un utilisateur reel..." -ForegroundColor White
$profiles = Invoke-WebRequest -Method GET "$BASE/rest/v1/profiles?select=id,email,full_name,role&email=not.is.null&limit=3" -Headers $H -UseBasicParsing
$users = $profiles.Content | ConvertFrom-Json
$buyer = $users | Where-Object { $_.role -eq "buyer" -or $_.role -eq "admin" } | Select-Object -First 1
if (-not $buyer) { $buyer = $users[0] }

Write-Host "Acheteur trouve: $($buyer.full_name) <$($buyer.email)>" -ForegroundColor Green

# Recuperer un vendeur
$sellers = Invoke-WebRequest -Method GET "$BASE/rest/v1/profiles?select=id,email,full_name&role=eq.seller&limit=1" -Headers $H -UseBasicParsing
$seller = ($sellers.Content | ConvertFrom-Json)[0]
Write-Host "Vendeur trouve: $($seller.full_name) <$($seller.email)>" -ForegroundColor Green

# Recuperer un shop
$shops = Invoke-WebRequest -Method GET "$BASE/rest/v1/shops?select=id,name,seller_id&limit=1" -Headers $H -UseBasicParsing
$shop = ($shops.Content | ConvertFrom-Json)[0]
Write-Host "Boutique trouvee: $($shop.name)" -ForegroundColor Green

# Recuperer un produit
$products = Invoke-WebRequest -Method GET "$BASE/rest/v1/products?select=id,title,price,seller_id&limit=1" -Headers $H -UseBasicParsing
$product = ($products.Content | ConvertFrom-Json)[0]
Write-Host "Produit trouve: $($product.title) - $($product.price)`$" -ForegroundColor Green

# 2. Creer une vraie commande dans la DB
Write-Host "`n>>> Creation d'une commande de test..." -ForegroundColor White
$orderId = [guid]::NewGuid().ToString()
$orderBody = @{
    id = $orderId
    buyer_id = $buyer.id
    status = "pending"
    total_amount = 129.99
    shipping_address = @{ street = "42 rue du Commerce"; city = "Montreal"; zip = "H2X 1Y5"; country = "Canada" }
    payment_method = "card"
} | ConvertTo-Json
$newOrder = Invoke-WebRequest -Method POST "$BASE/rest/v1/orders" -Headers ($H + @{"Prefer"="return=representation"}) -Body $orderBody -UseBasicParsing
$order = ($newOrder.Content | ConvertFrom-Json)[0]
Write-Host "Commande creee: #$($order.id.Substring(0,8).ToUpper())" -ForegroundColor Green

# Ajouter un article
$itemBody = @{
    order_id = $order.id
    product_id = $product.id
    seller_id = $product.seller_id
    title = $product.title
    unit_price = $product.price
    quantity = 2
} | ConvertTo-Json
Invoke-WebRequest -Method POST "$BASE/rest/v1/order_items" -Headers $H -Body $itemBody -UseBasicParsing | Out-Null
Write-Host "Article ajoute: $($product.title) x2" -ForegroundColor Green

# 3. Simuler le webhook on-new-order
Test-Step "TEST 1 — Email confirmation commande (acheteur + vendeur)" `
    "$BASE/functions/v1/on-new-order" `
    @{ record = $order }

Start-Sleep -Seconds 2

# 4. Simuler changement de statut → Expediee
Write-Host "`n>>> Mise a jour statut: shipped..." -ForegroundColor White
Invoke-WebRequest -Method PATCH "$BASE/rest/v1/orders?id=eq.$($order.id)" -Headers ($H + @{"Prefer"="return=representation"}) -Body '{"status":"shipped","tracking_number":"TRACK-TEST-123456"}' -UseBasicParsing | Out-Null

$orderShipped = @{ id=$order.id; buyer_id=$buyer.id; total_amount=129.99; status="shipped"; tracking_number="TRACK-TEST-123456" }
$orderOld = @{ id=$order.id; buyer_id=$buyer.id; total_amount=129.99; status="pending"; tracking_number=$null }

Test-Step "TEST 2 — Email statut Expediee avec numero de suivi" `
    "$BASE/functions/v1/on-order-status" `
    @{ record = $orderShipped; old_record = $orderOld }

Start-Sleep -Seconds 2

# 5. Simuler approbation KYC
if ($seller) {
    # Verifier si un kyc_request existe
    $kycs = Invoke-WebRequest -Method GET "$BASE/rest/v1/kyc_requests?select=id,seller_id,status&limit=1" -Headers $H -UseBasicParsing
    $kyc = ($kycs.Content | ConvertFrom-Json)[0]
    if ($kyc) {
        $kycNew = @{ id=$kyc.id; seller_id=$kyc.seller_id; status="approved"; review_notes=$null }
        $kycOld = @{ id=$kyc.id; seller_id=$kyc.seller_id; status="pending"; review_notes=$null }
        Test-Step "TEST 3 — Email KYC approuve (vendeur)" `
            "$BASE/functions/v1/on-kyc-update" `
            @{ record = $kycNew; old_record = $kycOld }
    } else {
        Write-Host "`n=== TEST 3 — KYC ===" -ForegroundColor Cyan
        Write-Host "SKIP: aucun kyc_request dans la DB" -ForegroundColor Yellow
    }
}

# 6. Nettoyage
Write-Host "`n>>> Nettoyage des donnees de test..." -ForegroundColor White
Invoke-WebRequest -Method DELETE "$BASE/rest/v1/order_items?order_id=eq.$($order.id)" -Headers $H -UseBasicParsing | Out-Null
Invoke-WebRequest -Method DELETE "$BASE/rest/v1/orders?id=eq.$($order.id)" -Headers $H -UseBasicParsing | Out-Null
Write-Host "Commande de test supprimee." -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTS TERMINES — Verifie ta boite mail!" -ForegroundColor Green
Write-Host "Tu dois avoir recu:" -ForegroundColor White
Write-Host "  1. Email confirmation commande" -ForegroundColor White
Write-Host "  2. Email commande expediee + numero de suivi" -ForegroundColor White
Write-Host "  3. Email KYC approuve (si kyc_request existe)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
