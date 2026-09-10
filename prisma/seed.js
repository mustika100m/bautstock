const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BautStock database...');

  // 1. Store Settings
  await prisma.storeSetting.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      storeName: 'Toko Baut & Fastener BautStock',
      address: 'Jl. Industri Raya No. 88, Jakarta Barat',
      phone: '021-5558888 / 0812-3456-7890',
      receiptHeader: 'PUSAT GROSIR & RETAIL BAUT, MUR, RING, SEKRUP',
      receiptFooter: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.\nTerima kasih atas kunjungan Anda!',
      allowNegativeStock: false,
    },
  });

  // 2. Users
  const users = [
    { username: 'owner', name: 'Bapak Pemilik (Owner)', password: '123', role: 'OWNER' },
    { username: 'admin', name: 'Siti Rahma (Admin)', password: '123', role: 'ADMIN' },
    { username: 'kasir', name: 'Budi Santoso (Kasir)', password: '123', role: 'KASIR' },
    { username: 'gudang', name: 'Eko Prasetyo (Gudang)', password: '123', role: 'GUDANG' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  // 3. Customers
  const customers = [
    {
      code: 'PLG-0001',
      name: 'Pelanggan Umum',
      phone: '0800000000',
      address: 'Jl. Umum No. 1, Jakarta',
      customerType: 'RETAIL',
      creditLimit: 0,
      paymentTermsDays: 0,
      notes: 'Pelanggan Cash Retail',
    },
    {
      code: 'PLG-0002',
      name: 'PT Konstruksi Jaya',
      phone: '081234567891',
      address: 'Jl. Daan Mogot Km 12 No. 45, Jakarta Barat',
      customerType: 'GROSIR',
      creditLimit: 50000000,
      paymentTermsDays: 30,
      notes: 'Kontraktor Bangunan & Baja',
    },
    {
      code: 'PLG-0003',
      name: 'Bengkel Maju Terus',
      phone: '081398765432',
      address: 'Jl. Raya Serpong No. 18, Tangerang',
      customerType: 'TEMPO',
      creditLimit: 15000000,
      paymentTermsDays: 14,
      notes: 'Bengkel Otomotif & Machining',
    },
    {
      code: 'PLG-0004',
      name: 'CV Sumber Teknik',
      phone: '081566778899',
      address: 'Kawasan Industri Cikarang Blok B-12, Bekasi',
      customerType: 'DISTRIBUTOR',
      creditLimit: 100000000,
      paymentTermsDays: 45,
      notes: 'Distributor Alat Teknik',
    },
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const cust = await prisma.customer.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    createdCustomers.push(cust);
  }

  // 4. Suppliers
  const suppliers = [
    {
      code: 'SUP-0001',
      name: 'PT Fastener Utama Indonesia',
      contactPerson: 'Bapak Hendra',
      phone: '081122334455',
      address: 'Kawasan Industri Pulogadung Jl. Rawa Gelam II No. 5, Jakarta Timur',
      notes: 'Supplier Utama Baut Karbon & Stainless',
    },
    {
      code: 'SUP-0002',
      name: 'CV Baut Nusantara',
      contactPerson: 'Ibu Dewi',
      phone: '081299887766',
      address: 'Jl. Margomulyo No. 24, Surabaya',
      notes: 'Supplier Mur & Ring Lokal',
    },
    {
      code: 'SUP-0003',
      name: 'PT Metalindo Presisi',
      contactPerson: 'Bapak Agus',
      phone: '081377665544',
      address: 'Jl. Jababeka V Blok C No. 8, Cikarang',
      notes: 'Spesialis Baut Heavy Duty & Custom Grade 10.9/12.9',
    },
  ];

  const createdSuppliers = [];
  for (const s of suppliers) {
    const sup = await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    createdSuppliers.push(sup);
  }

  // 5. Products
  const productsData = [
    {
      sku: 'BT-HB-M8-100-8.8-ZN',
      name: 'Baut Hex Bolt M8 x 100 mm 8.8 Zinc',
      category: 'Baut',
      itemType: 'Hex Bolt',
      metric: 'M8',
      length: '100 mm',
      material: 'Baja Karbon',
      grade: '8.8',
      finishing: 'Zinc Plating',
      unit: 'Pcs',
      pcsPerBox: 100,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak A',
      boxBin: 'A-01',
      stock: 450,
      minStock: 50,
      buyPrice: 1800,
      cashPrice: 2500,
      tempoPrice: 2800,
      retailPrice: 3000,
      wholesalePrice: 2200,
      barcode: '89910010001',
    },
    {
      sku: 'BT-HB-M10-50-SS304-PL',
      name: 'Baut Hex Bolt M10 x 50 mm SS304 Polished',
      category: 'Baut',
      itemType: 'Hex Bolt',
      metric: 'M10',
      length: '50 mm',
      material: 'Stainless Steel 304',
      grade: 'A2-70',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 50,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak A',
      boxBin: 'A-02',
      stock: 320,
      minStock: 40,
      buyPrice: 4500,
      cashPrice: 6500,
      tempoPrice: 7000,
      retailPrice: 7500,
      wholesalePrice: 5800,
      barcode: '89910010002',
    },
    {
      sku: 'BT-HB-M12-75-10.9-BO',
      name: 'Baut Hex Bolt M12 x 75 mm 10.9 Black Oxide',
      category: 'Baut',
      itemType: 'Hex Bolt',
      metric: 'M12',
      length: '75 mm',
      material: 'Baja Karbon',
      grade: '10.9',
      finishing: 'Black Oxide',
      unit: 'Pcs',
      pcsPerBox: 50,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak A',
      boxBin: 'A-03',
      stock: 180,
      minStock: 30,
      buyPrice: 5200,
      cashPrice: 7500,
      tempoPrice: 8200,
      retailPrice: 8800,
      wholesalePrice: 6800,
      barcode: '89910010003',
    },
    {
      sku: 'BT-FB-M6-20-8.8-YZ',
      name: 'Baut Flange Bolt M6 x 20 mm 8.8 Yellow Zinc',
      category: 'Baut',
      itemType: 'Flange Bolt',
      metric: 'M6',
      length: '20 mm',
      material: 'Baja Karbon',
      grade: '8.8',
      finishing: 'Yellow Zinc',
      unit: 'Pcs',
      pcsPerBox: 200,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak B',
      boxBin: 'B-01',
      stock: 800,
      minStock: 100,
      buyPrice: 600,
      cashPrice: 900,
      tempoPrice: 1000,
      retailPrice: 1200,
      wholesalePrice: 800,
      barcode: '89910010004',
    },
    {
      sku: 'BT-LB-M8-35-SS316-PL',
      name: 'Baut L Socket Cap M8 x 35 mm SS316 Polished',
      category: 'Baut',
      itemType: 'L Bolt',
      metric: 'M8',
      length: '35 mm',
      material: 'Stainless Steel 316',
      grade: 'A4-70',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 100,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak B',
      boxBin: 'B-02',
      stock: 150,
      minStock: 25,
      buyPrice: 5800,
      cashPrice: 8500,
      tempoPrice: 9200,
      retailPrice: 10000,
      wholesalePrice: 7500,
      barcode: '89910010005',
    },
    {
      sku: 'MR-HN-M8-8.8-ZN',
      name: 'Mur Hex Nut M8 8.8 Zinc',
      category: 'Mur',
      itemType: 'Hex Nut',
      metric: 'M8',
      length: '-',
      material: 'Baja Karbon',
      grade: '8.8',
      finishing: 'Zinc Plating',
      unit: 'Pcs',
      pcsPerBox: 500,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak C',
      boxBin: 'C-01',
      stock: 1200,
      minStock: 200,
      buyPrice: 300,
      cashPrice: 500,
      tempoPrice: 550,
      retailPrice: 600,
      wholesalePrice: 420,
      barcode: '89920010001',
    },
    {
      sku: 'MR-HN-M10-SS304-PL',
      name: 'Mur Hex Nut M10 SS304 Polished',
      category: 'Mur',
      itemType: 'Hex Nut',
      metric: 'M10',
      length: '-',
      material: 'Stainless Steel 304',
      grade: 'A2-70',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 250,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak C',
      boxBin: 'C-02',
      stock: 600,
      minStock: 100,
      buyPrice: 1200,
      cashPrice: 1800,
      tempoPrice: 2000,
      retailPrice: 2200,
      wholesalePrice: 1500,
      barcode: '89920010002',
    },
    {
      sku: 'MR-LN-M8-SS304-PL',
      name: 'Mur Nylon Lock Nut M8 SS304 Polished',
      category: 'Mur',
      itemType: 'Nylon Lock Nut',
      metric: 'M8',
      length: '-',
      material: 'Stainless Steel 304',
      grade: 'A2-70',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 200,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak C',
      boxBin: 'C-03',
      stock: 350,
      minStock: 50,
      buyPrice: 1600,
      cashPrice: 2400,
      tempoPrice: 2600,
      retailPrice: 2800,
      wholesalePrice: 2100,
      barcode: '89920010003',
    },
    {
      sku: 'RG-FW-M8-SS304-PL',
      name: 'Ring Flat Washer M8 SS304 Polished',
      category: 'Ring',
      itemType: 'Flat Washer',
      metric: 'M8',
      length: '-',
      material: 'Stainless Steel 304',
      grade: 'A2-70',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 1000,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak D',
      boxBin: 'D-01',
      stock: 2500,
      minStock: 300,
      buyPrice: 200,
      cashPrice: 350,
      tempoPrice: 400,
      retailPrice: 450,
      wholesalePrice: 280,
      barcode: '89930010001',
    },
    {
      sku: 'RG-SW-M10-8.8-BO',
      name: 'Ring Spring Washer M10 8.8 Black Oxide',
      category: 'Ring',
      itemType: 'Spring Washer',
      metric: 'M10',
      length: '-',
      material: 'Baja Karbon',
      grade: '8.8',
      finishing: 'Black Oxide',
      unit: 'Pcs',
      pcsPerBox: 500,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak D',
      boxBin: 'D-02',
      stock: 900,
      minStock: 150,
      buyPrice: 350,
      cashPrice: 600,
      tempoPrice: 650,
      retailPrice: 750,
      wholesalePrice: 500,
      barcode: '89930010002',
    },
    {
      sku: 'SK-ST-M4-25-SS304-PL',
      name: 'Sekrup Self Tapping Screw 4.2 x 25 mm SS304',
      category: 'Sekrup',
      itemType: 'Self Tapping Screw',
      metric: 'M4',
      length: '25 mm',
      material: 'Stainless Steel 304',
      grade: 'Standard',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 500,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak E',
      boxBin: 'E-01',
      stock: 1400,
      minStock: 200,
      buyPrice: 400,
      cashPrice: 700,
      tempoPrice: 750,
      retailPrice: 850,
      wholesalePrice: 550,
      barcode: '89940010001',
    },
    {
      sku: 'BT-HHB-M20-150-10.9-GV',
      name: 'Baut Heavy Hex Bolt M20 x 150 mm 10.9 Galvanized',
      category: 'Baut',
      itemType: 'Heavy Hex Bolt',
      metric: 'M20',
      length: '150 mm',
      material: 'Baja Karbon',
      grade: '10.9',
      finishing: 'Galvanized',
      unit: 'Pcs',
      pcsPerBox: 25,
      warehouse: 'Gudang Utam',
      rackLocation: 'Rak Heavy',
      boxBin: 'H-01',
      stock: 5, // STOK MENIPIS
      minStock: 20,
      buyPrice: 22000,
      cashPrice: 32000,
      tempoPrice: 35000,
      retailPrice: 38000,
      wholesalePrice: 29000,
      barcode: '89910010006',
    },
    {
      sku: 'BT-SB-M4-10-SS304-PL',
      name: 'Baut Stainless Bolt M4 x 10 mm SS304 Polished',
      category: 'Baut',
      itemType: 'Stainless Bolt',
      metric: 'M4',
      length: '10 mm',
      material: 'Stainless Steel 304',
      grade: 'A2-70',
      finishing: 'Polished',
      unit: 'Pcs',
      pcsPerBox: 200,
      warehouse: 'Gudang Utama',
      rackLocation: 'Rak A',
      boxBin: 'A-05',
      stock: 0, // STOK HABIS
      minStock: 50,
      buyPrice: 800,
      cashPrice: 1300,
      tempoPrice: 1450,
      retailPrice: 1600,
      wholesalePrice: 1100,
      barcode: '89910010007',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    createdProducts.push(prod);
  }

  // Initial stock movements for products
  for (const prod of createdProducts) {
    if (prod.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: prod.id,
          type: 'INITIAL_STOCK',
          refNo: 'INIT-' + prod.sku,
          qtyIn: prod.stock,
          qtyOut: 0,
          stockBefore: 0,
          stockAfter: prod.stock,
          userName: 'System Admin',
          notes: 'Stok awal sistem BautStock',
        },
      });
    }
  }

  // 6. Sample Purchase Transaction
  const p1 = createdProducts[0]; // M8x100
  const p2 = createdProducts[1]; // M10x50
  const sup1 = createdSuppliers[0];

  const purchase = await prisma.purchase.create({
    data: {
      invoiceNo: 'PUR-20260901-001',
      supplierInvoiceNo: 'INV-FUI/99812',
      supplierId: sup1.id,
      date: new Date('2026-09-01'),
      totalAmount: 1800000,
      notes: 'Pembelian restock Baut M8 & M10',
      status: 'COMPLETED',
      items: {
        create: [
          {
            productId: p1.id,
            qty: 500,
            buyPrice: 1800,
            subtotal: 900000,
          },
          {
            productId: p2.id,
            qty: 200,
            buyPrice: 4500,
            subtotal: 900000,
          },
        ],
      },
    },
  });

  // Payable for purchase
  await prisma.payable.create({
    data: {
      purchaseId: purchase.id,
      supplierId: sup1.id,
      totalAmount: 1800000,
      paidAmount: 800000,
      remainingAmount: 1000000,
      dueDate: new Date('2026-10-01'),
      status: 'PARTIAL',
    },
  });

  // 7. Sample Sales Transactions (POS)
  const custGrosir = createdCustomers[1]; // PT Konstruksi Jaya
  const custTempo = createdCustomers[2]; // Bengkel Maju Terus

  // Sale 1: CASH Grosir
  const sale1 = await prisma.sale.create({
    data: {
      invoiceNo: 'POS-20260908-001',
      date: new Date('2026-09-08T09:30:00'),
      customerId: custGrosir.id,
      customerName: custGrosir.name,
      priceType: 'WHOLESALE',
      paymentMethod: 'CASH',
      totalAmount: 1540000,
      discount: 40000,
      grandTotal: 1500000,
      paidAmount: 1500000,
      changeAmount: 0,
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      createdBy: 'Budi Santoso (Kasir)',
      items: {
        create: [
          {
            productId: p1.id,
            qty: 500,
            price: 2200,
            discount: 0,
            subtotal: 1100000,
          },
          {
            productId: p2.id,
            qty: 100,
            price: 5800,
            discount: 140000,
            subtotal: 440000,
          },
        ],
      },
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: p1.id,
      type: 'SALE',
      refNo: sale1.invoiceNo,
      qtyIn: 0,
      qtyOut: 500,
      stockBefore: 950,
      stockAfter: 450,
      userName: 'Budi Santoso (Kasir)',
      notes: 'Penjualan POS POS-20260908-001',
    },
  });

  // Sale 2: TEMPO
  const sale2 = await prisma.sale.create({
    data: {
      invoiceNo: 'POS-20260909-002',
      date: new Date('2026-09-09T10:00:00'),
      customerId: custTempo.id,
      customerName: custTempo.name,
      priceType: 'TEMPO',
      paymentMethod: 'CREDIT',
      totalAmount: 2460000,
      discount: 60000,
      grandTotal: 2400000,
      paidAmount: 500000,
      changeAmount: 0,
      paymentStatus: 'PARTIAL',
      status: 'COMPLETED',
      createdBy: 'Budi Santoso (Kasir)',
      items: {
        create: [
          {
            productId: p2.id,
            qty: 200,
            price: 7000,
            discount: 0,
            subtotal: 1400000,
          },
          {
            productId: createdProducts[2].id, // M12x75
            qty: 120,
            price: 8200,
            discount: 24000,
            subtotal: 960000,
          },
        ],
      },
    },
  });

  await prisma.receivable.create({
    data: {
      saleId: sale2.id,
      customerId: custTempo.id,
      totalAmount: 2400000,
      paidAmount: 500000,
      remainingAmount: 1900000,
      dueDate: new Date('2026-09-23'),
      status: 'PARTIAL',
    },
  });

  // 8. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userName: 'System',
        action: 'SEED_DATABASE',
        details: 'Menginisialisasi data toko, master barang, supplier, dan pelanggan.',
      },
      {
        userName: 'Siti Rahma (Admin)',
        action: 'ADD_PRODUCT',
        details: 'Menambahkan produk baru BT-HB-M8-100-8.8-ZN ke master barang.',
      },
      {
        userName: 'Budi Santoso (Kasir)',
        action: 'SALE_TRANSACTION',
        details: 'Melakukan transaksi penjualan invoice POS-20260909-002 total Rp 2.400.000 (Tempo).',
      },
    ],
  });

  console.log('BautStock Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
