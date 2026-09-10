'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  User,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  Ban,
  Tag,
  UserPlus,
  Edit,
  Eye,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PenjualanPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Master Data
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState('');

  // POS State: Customer Selection Mode ('existing' | 'new')
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  const [priceType, setPriceType] = useState<'CASH' | 'TEMPO' | 'RETAIL' | 'WHOLESALE'>('CASH');
  const [cart, setCart] = useState<any[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed Receipt Modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [storeSetting, setStoreSetting] = useState<any>(null);

  // Detail & Edit Sale Modal
  const [viewingSale, setViewingSale] = useState<any | null>(null);
  const [isEditingSale, setIsEditingSale] = useState(false);
  const [editSaleForm, setEditSaleForm] = useState({
    customerName: '',
    priceType: 'CASH',
    paymentMethod: 'CASH',
    discount: 0,
    notes: '',
  });

  // Void & Delete Sale Dialog
  const [voidingSale, setVoidingSale] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('Salah input data');
  const [deletingSale, setDeletingSale] = useState<any | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSalesHistory();
    fetchStoreSetting();
  }, []);

  const fetchStoreSetting = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) setStoreSetting(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSaleDetail = (sale: any) => {
    setViewingSale(sale);
    setIsEditingSale(false);
    setEditSaleForm({
      customerName: sale.customerName || 'Pelanggan Umum',
      priceType: sale.priceType || 'CASH',
      paymentMethod: sale.paymentMethod || 'CASH',
      discount: sale.discount || 0,
      notes: sale.notes || '',
    });
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingSale) return;
    try {
      const res = await fetch(`/api/sales/${viewingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSaleForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengupdate transaksi');

      showToast(`Data transaksi ${data.invoiceNo} berhasil diperbarui!`, 'success');
      setViewingSale(data);
      setIsEditingSale(false);
      fetchSalesHistory();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSalesHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // When customer changes, auto select price tier based on customer type
  const handleCustomerChange = (custCodeId: string) => {
    setSelectedCustomerId(custCodeId);
    if (!custCodeId) {
      setPriceType('CASH');
      return;
    }

    const cust = customers.find((c) => c.id === custCodeId);
    if (cust) {
      if (cust.customerType === 'GROSIR') setPriceType('WHOLESALE');
      else if (cust.customerType === 'TEMPO') {
        setPriceType('TEMPO');
        setPaymentMethod('CREDIT');
      } else if (cust.customerType === 'DISTRIBUTOR') setPriceType('WHOLESALE');
      else setPriceType('RETAIL');
    }
  };

  // Add item to cart
  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.productId === product.id);
    let selectedPrice = product.cashPrice;
    if (priceType === 'TEMPO') selectedPrice = product.tempoPrice;
    if (priceType === 'RETAIL') selectedPrice = product.retailPrice;
    if (priceType === 'WHOLESALE') selectedPrice = product.wholesalePrice;

    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          stock: product.stock,
          qty: 1,
          price: selectedPrice,
          discount: 0,
        },
      ]);
    }
  };

  // Update item qty in cart (supports typing manual number!)
  const updateCartQtyExact = (productId: string, val: number) => {
    const targetQty = Math.max(1, isNaN(val) ? 1 : val);
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, qty: targetQty } : item
      )
    );
  };

  const updateCartQtyDelta = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Recalculate price when priceType changes
  useEffect(() => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;
        let pVal = prod.cashPrice;
        if (priceType === 'TEMPO') pVal = prod.tempoPrice;
        if (priceType === 'RETAIL') pVal = prod.retailPrice;
        if (priceType === 'WHOLESALE') pVal = prod.wholesalePrice;
        return { ...item, price: pVal };
      })
    );
  }, [priceType]);

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const grandTotal = Math.max(0, subtotal - orderDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Keranjang belanja kosong!', 'error');
      return;
    }

    let finalCustomerName = 'Pelanggan Umum';
    if (customerMode === 'existing') {
      const selectedCust = customers.find((c) => c.id === selectedCustomerId);
      if (selectedCust) finalCustomerName = selectedCust.name;
    } else {
      finalCustomerName = newCustomerName.trim() || 'Pelanggan Baru';
    }

    setIsProcessing(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('bautstock_user') || '{}');

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerMode === 'existing' ? selectedCustomerId || null : null,
          customerName: finalCustomerName,
          customerMode,
          newCustomerPhone,
          priceType,
          paymentMethod,
          discount: orderDiscount,
          paidAmount: paymentMethod === 'CREDIT' ? 0 : paidAmount || grandTotal,
          items: cart,
          createdBy: currentUser?.name || 'Kasir BautStock',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat transaksi');

      showToast(`Penjualan ${data.invoiceNo} berhasil diproses!`, 'success');
      setCompletedSale(data);
      setCart([]);
      setOrderDiscount(0);
      setPaidAmount(0);
      setNewCustomerName('');
      setNewCustomerPhone('');
      fetchProducts();
      fetchCustomers();
      fetchSalesHistory();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoidSale = async () => {
    if (!voidingSale) return;
    try {
      const currentUser = JSON.parse(localStorage.getItem('bautstock_user') || '{}');
      const res = await fetch(`/api/sales/${voidingSale.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason, userName: currentUser?.name || 'Kasir' }),
      });
      showToast(`Penjualan ${voidingSale.invoiceNo} telah dibatalkan & stok dikembalikan!`, 'success');
      setVoidingSale(null);
      fetchProducts();
      fetchSalesHistory();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSale = async () => {
    if (!deletingSale) return;
    try {
      const res = await fetch(`/api/sales/${deletingSale.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus transaksi penjualan');
      showToast(`Transaksi penjualan ${deletingSale.invoiceNo} berhasil dihapus!`, 'success');
      setDeletingSale(null);
      if (viewingSale?.id === deletingSale.id) setViewingSale(null);
      fetchProducts();
      fetchSalesHistory();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.metric.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Penjualan & Kasir (POS)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Kasir Pintar dengan 4-tier pricing otomatis & input Qty manual.
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kasir POS Baru
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Riwayat Transaksi
          </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Picker (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search Input */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari baut, SKU, atau metric..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="flex-1 text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[650px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => {
                let pPrice = prod.cashPrice;
                if (priceType === 'TEMPO') pPrice = prod.tempoPrice;
                if (priceType === 'RETAIL') pPrice = prod.retailPrice;
                if (priceType === 'WHOLESALE') pPrice = prod.wholesalePrice;

                return (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="bg-white hover:border-emerald-500 border border-slate-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>{prod.sku}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            prod.stock > prod.minStock
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          Stok: {prod.stock}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {prod.metric} x {prod.length} ({prod.material})
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Harga ({priceType}):
                      </span>
                      <span className="text-sm font-black text-emerald-600">
                        {formatRupiah(pPrice)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: POS Cart & Billing Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Customer Mode Selection */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-600" /> Pilihan Jenis Pelanggan:
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('existing')}
                      className={`py-1.5 px-3 rounded-lg border font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                        customerMode === 'existing'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> Pelanggan Lama
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      className={`py-1.5 px-3 rounded-lg border font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                        customerMode === 'new'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Pelanggan Baru
                    </button>
                  </div>

                  {customerMode === 'existing' ? (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-full bg-white p-2 rounded-lg border border-slate-200 font-semibold text-slate-800"
                    >
                      <option value="">Pelanggan Umum (Cash)</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code} - Tipe: {c.customerType})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nama Pelanggan Baru (Ketik manual)..."
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="w-full bg-white p-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="No. HP / WhatsApp Pelanggan (Opsional)..."
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="w-full bg-white p-2 rounded-lg border border-slate-200 font-semibold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-500" /> Tipe Harga Digunakan
                  </label>
                  <div className="grid grid-cols-4 gap-1 text-center font-extrabold text-[10px]">
                    {(['CASH', 'TEMPO', 'RETAIL', 'WHOLESALE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPriceType(t)}
                        className={`py-1.5 rounded-lg border transition-all ${
                          priceType === t
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Barang ({cart.length} Item)
                </h3>
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                    Keranjang masih kosong. Klik barang di sebelah kiri untuk menambahkan.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs border border-slate-100"
                    >
                      <div className="flex-1 pr-2">
                        <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {formatRupiah(item.price)} / {item.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateCartQtyDelta(item.productId, -1)}
                            className="p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateCartQtyExact(item.productId, parseInt(e.target.value))}
                            className="w-14 text-center font-extrabold text-slate-900 text-xs py-1 focus:outline-none bg-emerald-50/40"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQtyDelta(item.productId, 1)}
                            className="p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-slate-800 w-20 text-right">
                          {formatRupiah(item.qty * item.price)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Subtotal:</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>Diskon Nota (Rp):</span>
                <input
                  type="number"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(Number(e.target.value))}
                  className="w-28 p-1 rounded border border-slate-200 font-bold text-right text-xs"
                />
              </div>

              <div className="flex justify-between text-base font-black text-slate-900 bg-slate-100 p-3 rounded-xl">
                <span>GRAND TOTAL:</span>
                <span className="text-emerald-600">{formatRupiah(grandTotal)}</span>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                {(['CASH', 'TRANSFER', 'CREDIT'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl border transition-all ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {m === 'CREDIT' ? 'TEMPO' : m}
                  </button>
                ))}
              </div>

              {paymentMethod === 'CASH' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-600">Nominal Tunai:</span>
                  <input
                    type="number"
                    value={paidAmount || grandTotal}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-36 p-2 rounded-xl border border-slate-200 font-bold text-right text-sm"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isProcessing ? 'Memproses Transaksi...' : 'Bayar & Simpan Struk (POS)'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Riwayat Penjualan Kasir</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-y">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Tipe Harga</th>
                  <th className="py-3 px-4">Status Transaksi</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesHistory.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleOpenSaleDetail(s)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-sky-700">{s.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTanggal(s.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{s.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border">
                        {s.priceType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          s.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {s.status === 'CANCELLED' ? 'DIBATALKAN (VOID)' : 'SELESAI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">
                      {formatRupiah(s.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenSaleDetail(s)}
                          className="px-2.5 py-1 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Lihat Detail & Edit / Cetak Struk"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>

                         <button
                          onClick={() => setCompletedSale(s)}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Cetak</span>
                        </button>

                        {s.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setVoidingSale(s)}
                            className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Void Transaksi"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Void</span>
                          </button>
                        )}

                        <button
                          onClick={() => setDeletingSale(s)}
                          className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          title="Hapus Transaksi Penjualan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Detail & Edit Modal */}
      {viewingSale && (
        <Modal
          isOpen={!!viewingSale}
          onClose={() => setViewingSale(null)}
          title={`Detail & Edit Transaksi Penjualan: ${viewingSale.invoiceNo}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Action Bar inside Modal */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Status Transaksi:</span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    viewingSale.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {viewingSale.status === 'CANCELLED' ? 'DIBATALKAN (VOID)' : 'SELESAI'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompletedSale(viewingSale)}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cetak Ulang Struk / Nota</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSale(!isEditingSale)}
                  className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-all flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingSale ? 'Batal Edit' : 'Edit Transaksi'}</span>
                </button>
              </div>
            </div>

            {/* Editable Form vs Readonly View */}
            {isEditingSale ? (
              <form onSubmit={handleUpdateSale} className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 space-y-3">
                <h4 className="font-bold text-sky-900 border-b border-sky-200 pb-1">Edit Informasi Transaksi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Pelanggan</label>
                    <input
                      type="text"
                      value={editSaleForm.customerName}
                      onChange={(e) => setEditSaleForm({ ...editSaleForm, customerName: e.target.value })}
                      className="w-full p-2 rounded-lg border font-semibold bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipe Harga</label>
                    <select
                      value={editSaleForm.priceType}
                      onChange={(e) => setEditSaleForm({ ...editSaleForm, priceType: e.target.value })}
                      className="w-full p-2 rounded-lg border font-bold bg-white"
                    >
                      <option value="CASH">CASH (Harga Tunai Standard)</option>
                      <option value="RETAIL">RETAIL (Harga Eceran)</option>
                      <option value="WHOLESALE">WHOLESALE (Harga Grosir)</option>
                      <option value="TEMPO">TEMPO (Kredit / Jatuh Tempo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                    <select
                      value={editSaleForm.paymentMethod}
                      onChange={(e) => setEditSaleForm({ ...editSaleForm, paymentMethod: e.target.value })}
                      className="w-full p-2 rounded-lg border font-bold bg-white"
                    >
                      <option value="CASH">CASH (Tunai)</option>
                      <option value="TRANSFER">TRANSFER BANK</option>
                      <option value="CREDIT">CREDIT / TEMPO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Diskon Transaksi (Rp)</label>
                    <input
                      type="number"
                      value={editSaleForm.discount}
                      onChange={(e) => setEditSaleForm({ ...editSaleForm, discount: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border font-bold text-right bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Transaksi</label>
                  <input
                    type="text"
                    value={editSaleForm.notes}
                    onChange={(e) => setEditSaleForm({ ...editSaleForm, notes: e.target.value })}
                    className="w-full p-2 rounded-lg border font-semibold bg-white"
                    placeholder="Tambahkan catatan khusus..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-sky-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingSale(false)}
                    className="px-3 py-1.5 font-bold text-slate-600 bg-white border hover:bg-slate-100 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">No. Invoice</span>
                  <span className="font-extrabold text-slate-900 font-mono">{viewingSale.invoiceNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Tanggal</span>
                  <span className="font-semibold text-slate-800">{formatTanggal(viewingSale.date || viewingSale.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Pelanggan</span>
                  <span className="font-bold text-slate-800">{viewingSale.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Kasir / User</span>
                  <span className="font-semibold text-slate-800">{viewingSale.createdBy}</span>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px]">Rincian Barang Terjual</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold border-b">
                    <tr>
                      <th className="py-2 px-3">Nama Barang</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga Satuan</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewingSale.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-bold text-slate-800">{item.product?.name || 'Produk Fastener'}</td>
                        <td className="py-2 px-3 text-center font-semibold">{item.qty} {item.product?.unit || 'Pcs'}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.price)}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-slate-900">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal Barang:</span>
                <span>{formatRupiah(viewingSale.totalAmount)}</span>
              </div>
              {viewingSale.discount > 0 && (
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>Diskon Nota:</span>
                  <span>-{formatRupiah(viewingSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>GRAND TOTAL:</span>
                <span className="text-emerald-400">{formatRupiah(viewingSale.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal - Styled identically for App Screen & Paper Print Preview */}
      {completedSale && (
        <Modal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          title="Struk Penjualan (POS)"
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Printable Thermal Receipt Card */}
            <div
              id="printable-area"
              className="p-5 bg-white font-mono text-xs border border-slate-300 rounded-xl space-y-3 shadow-sm mx-auto max-w-[320px] text-slate-900"
            >
              <div className="text-center border-b border-dashed pb-3 border-slate-300">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  {storeSetting?.storeName || 'TOKO BAUT & FASTENER BAUTSTOCK'}
                </h3>
                {storeSetting?.receiptHeader && (
                  <p className="text-[10px] text-slate-600 mt-0.5 whitespace-pre-line">{storeSetting.receiptHeader}</p>
                )}
                {storeSetting?.address && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{storeSetting.address}</p>
                )}
                {storeSetting?.phone && (
                  <p className="text-[10px] text-slate-500">Telp: {storeSetting.phone}</p>
                )}
              </div>

              <div className="text-[11px] space-y-1 text-slate-800 border-b border-dashed pb-3 border-slate-300">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span className="font-bold text-slate-900">{completedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatTanggal(completedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{completedSale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe Harga:</span>
                  <span>{completedSale.priceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{completedSale.createdBy}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-b border-dashed pb-3 border-slate-300">
                {completedSale.items?.map((item: any) => (
                  <div key={item.id} className="text-[11px]">
                    <div className="font-bold text-slate-900 leading-tight">{item.product?.name || 'Produk Fastener'}</div>
                    <div className="flex justify-between text-slate-600 mt-0.5">
                      <span>{item.qty} {item.product?.unit || 'Pcs'} x {formatRupiah(item.price)}</span>
                      <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div className="space-y-1 text-xs border-b border-dashed pb-3 border-slate-300">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedSale.totalAmount)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon Nota:</span>
                    <span>-{formatRupiah(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-900 font-black pt-1.5 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span className="text-emerald-700">{formatRupiah(completedSale.grandTotal)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-1 text-[11px] text-slate-800 border-b border-dashed pb-3 border-slate-300">
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="font-bold">{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai:</span>
                      <span>{formatRupiah(completedSale.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(completedSale.changeAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-600 pt-1 leading-relaxed whitespace-pre-line">
                {storeSetting?.receiptFooter || 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.\nTerima kasih telah berbelanja di BautStock!'}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow hover:bg-slate-800 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Void Confirmation Modal */}
      {voidingSale && (
        <Modal
          isOpen={!!voidingSale}
          onClose={() => setVoidingSale(null)}
          title={`Pembatalan / Void Transaksi: ${voidingSale.invoiceNo}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Membatalkan penjualan ini akan mengembalikan stok fisik produk ke dalam database dan mengubah status invoice menjadi <strong>CANCELLED</strong>.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alasan Pembatalan</label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                required
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setVoidingSale(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleVoidSale}
                className="px-5 py-2 font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md"
              >
                Konfirmasi Pembatalan (Void)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deletingSale && (
        <ConfirmDialog
          isOpen={!!deletingSale}
          onClose={() => setDeletingSale(null)}
          onConfirm={handleDeleteSale}
          title="Hapus Transaksi Penjualan"
          message={`Apakah Anda yakin ingin menghapus transaksi penjualan ${deletingSale.invoiceNo} secara permanen? Transaksi akan dihapus dari riwayat dan stok produk akan disesuaikan.`}
          isDangerous={true}
        />
      )}
    </div>
  );
}
