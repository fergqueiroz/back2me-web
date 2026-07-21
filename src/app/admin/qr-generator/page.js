'use client';

import { useState, useEffect, useRef } from 'react';
import { generateQRTags, getQRGeneratorHistory, updateTagStatusBulk, scanAndUpdateTagStatus } from '../actions';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_CONFIG = {
  unregistered: { label: 'Generated', color: '#1e40af', bg: '#dbeafe', icon: '⚡' },
  generated: { label: 'Generated', color: '#1e40af', bg: '#dbeafe', icon: '⚡' },
  manufactured: { label: 'Manufactured', color: '#6b21a8', bg: '#f3e8ff', icon: '🏭' },
  in_stock: { label: 'In Stock', color: '#065f46', bg: '#d1fae5', icon: '📦' },
  sold: { label: 'Sold', color: '#9a3412', bg: '#ffedd5', icon: '🛍️' },
  active: { label: 'Activated', color: '#047857', bg: '#ecfdf5', icon: '🛡️' },
};

export default function QRGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'history' | 'in_stock_scanner' | 'sold_scanner'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHistoryTags, setSelectedHistoryTags] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanLogs, setScanLogs] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const scannerInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'in_stock_scanner' || activeTab === 'sold_scanner') {
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const res = await getQRGeneratorHistory(2000);
    if (res.tags) {
      setHistory(res.tags);
    }
    setHistoryLoading(false);
  };

  const playBeep = (freq = 880, type = 'sine', duration = 0.15) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context ignored if not user gesture
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const type = formData.get('type');
    const quantity = formData.get('quantity');

    const res = await generateQRTags(type, quantity);
    if (res.error) {
      setError(res.error);
    } else if (res.tags) {
      setTags(res.tags);
      setHistory((prev) => [...res.tags, ...prev]);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBulkStatusUpdate = async (targetStatus) => {
    if (selectedHistoryTags.length === 0) return;
    setBulkActionLoading(true);
    
    const tagIds = selectedHistoryTags.map(t => t.id);
    const res = await updateTagStatusBulk(tagIds, targetStatus);
    
    if (res.success) {
      setHistory(prev => prev.map(item => {
        if (tagIds.includes(item.id)) {
          return { ...item, status: targetStatus };
        }
        return item;
      }));
      setSelectedHistoryTags([]);
      playBeep(900, 'sine', 0.2);
    } else {
      alert(`Error updating status: ${res.error}`);
      playBeep(300, 'sawtooth', 0.3);
    }
    setBulkActionLoading(false);
  };

  const handleFastScannerSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim() || scanLoading) return;
    
    const codeToScan = scanInput.trim();
    const targetStatus = activeTab === 'in_stock_scanner' ? 'in_stock' : 'sold';
    setScanLoading(true);

    const res = await scanAndUpdateTagStatus(codeToScan, targetStatus);

    if (res.success && res.tag) {
      playBeep(1046.5, 'sine', 0.12); // High C sound for success scan
      const newLog = {
        id: Date.now(),
        code: res.tag.qr_code,
        type: res.tag.type,
        status: targetStatus,
        prevStatus: res.previousStatus,
        time: new Date().toLocaleTimeString('pt-BR'),
        success: true
      };
      setScanLogs(prev => [newLog, ...prev]);
      
      // Update history in state
      setHistory(prev => prev.map(t => t.id === res.tag.id ? { ...t, status: targetStatus } : t));
    } else {
      playBeep(250, 'sawtooth', 0.3); // Low tone for error
      const newLog = {
        id: Date.now(),
        code: codeToScan,
        time: new Date().toLocaleTimeString('pt-BR'),
        success: false,
        error: res.error || 'Code not found'
      };
      setScanLogs(prev => [newLog, ...prev]);
    }

    setScanInput('');
    setScanLoading(false);
    setTimeout(() => scannerInputRef.current?.focus(), 50);
  };

  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      item.qr_code.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter || (statusFilter === 'generated' && item.status === 'unregistered');
    return matchesSearch && matchesStatus;
  });

  const loadHistoryToPrintGrid = (tagsToPrint) => {
    setTags(tagsToPrint);
    setActiveTab('generator');
  };

  const counts = {
    all: history.length,
    generated: history.filter(t => t.status === 'generated' || t.status === 'unregistered').length,
    manufactured: history.filter(t => t.status === 'manufactured').length,
    in_stock: history.filter(t => t.status === 'in_stock').length,
    sold: history.filter(t => t.status === 'sold').length,
    active: history.filter(t => t.status === 'active').length,
  };

  return (
    <div className="admin-page qr-generator-page">
      {/* Page Header */}
      <div className="admin-page-header no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="admin-page-title">QR Code Lifecycle & Audit Center</h1>
            <p className="admin-page-subtitle">
              Gerencie a produção, estoque (In Stock), despacho (Sold) e ativação de todas as tags Back2Me.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              ⚡ Generated: {counts.generated}
            </span>
            <span style={{ padding: '6px 12px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              🏭 Manufactured: {counts.manufactured}
            </span>
            <span style={{ padding: '6px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              📦 In Stock: {counts.in_stock}
            </span>
            <span style={{ padding: '6px 12px', background: '#ffedd5', color: '#9a3412', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              🛍️ Sold: {counts.sold}
            </span>
            <span style={{ padding: '6px 12px', background: '#ecfdf5', color: '#047857', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              🛡️ Active: {counts.active}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '12px 18px',
            border: 'none',
            borderBottom: activeTab === 'generator' ? '3px solid #f97316' : '3px solid transparent',
            background: 'none',
            fontWeight: '700',
            fontSize: '14px',
            color: activeTab === 'generator' ? '#f97316' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          ⚡ Novo Lote
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 18px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #f97316' : '3px solid transparent',
            background: 'none',
            fontWeight: '700',
            fontSize: '14px',
            color: activeTab === 'history' ? '#f97316' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          📜 Histórico & Lifecycle ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('in_stock_scanner')}
          style={{
            padding: '12px 18px',
            border: 'none',
            borderBottom: activeTab === 'in_stock_scanner' ? '3px solid #10b981' : '3px solid transparent',
            background: 'none',
            fontWeight: '700',
            fontSize: '14px',
            color: activeTab === 'in_stock_scanner' ? '#10b981' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          📦 Scanner de Entrada (In Stock)
        </button>
        <button
          onClick={() => setActiveTab('sold_scanner')}
          style={{
            padding: '12px 18px',
            border: 'none',
            borderBottom: activeTab === 'sold_scanner' ? '3px solid #f97316' : '3px solid transparent',
            background: 'none',
            fontWeight: '700',
            fontSize: '14px',
            color: activeTab === 'sold_scanner' ? '#f97316' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          🛍️ Scanner de Despacho (Sold)
        </button>
      </div>

      {/* TAB 1: GENERATOR */}
      {activeTab === 'generator' && (
        <>
          <div className="admin-card no-print" style={{ marginBottom: '32px' }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>Tipo de Merchandise</label>
                <select name="type" required style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}>
                  <option value="wristband">Wristband (Pulseira)</option>
                  <option value="luggage_tag">Luggage Tag (Mala)</option>
                  <option value="pet_tag">Pet Tag (Coleira)</option>
                  <option value="sticker">Sticker (Adesivo)</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>Quantidade (Máx 500)</label>
                <input type="number" name="quantity" required min="1" max="500" defaultValue="10" style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              </div>
              <div>
                <button type="submit" disabled={loading} className="btn btn-navy" style={{ padding: '11px 24px' }}>
                  {loading ? 'Gerando com verificação...' : '✨ Gerar Tags Únicas'}
                </button>
              </div>
            </form>
            {error && <p style={{ color: '#dc2626', marginTop: '16px', fontSize: '14px' }}>{error}</p>}
          </div>

          {tags.length > 0 ? (
            <div className="qr-results-section">
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', color: '#111827', margin: 0 }}>Tags Prontas para Impressão ({tags.length})</h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Códigos registrados com URL limpa no formato Tag ID (/scan/B2M-XXXXXX).</p>
                </div>
                <button onClick={handlePrint} className="btn" style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', fontWeight: '600' }}>
                  🖨️ Imprimir / Salvar PDF
                </button>
              </div>

              <div className="qr-print-grid">
                {tags.map((tag) => (
                  <div key={tag.id} className="qr-print-item">
                    <QRCodeSVG 
                      value={`https://www.back2meglobal.com/scan/${tag.qr_code}`} 
                      size={120}
                      level="Q"
                      includeMargin={true}
                    />
                    <div className="qr-print-details">
                      <strong>{tag.qr_code}</strong>
                      <span>{tag.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-print" style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <p style={{ color: '#6b7280', fontSize: '15px' }}>Nenhum lote gerado na sessão atual.</p>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Preencha o formulário acima para gerar novos códigos ou consulte o Histórico.</p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: HISTORY & BULK LIFECYCLE */}
      {activeTab === 'history' && (
        <div className="no-print">
          {/* Status Filter Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['all', 'generated', 'manufactured', 'in_stock', 'sold', 'active'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: statusFilter === st ? '2px solid #0f172a' : '1px solid #d1d5db',
                  background: statusFilter === st ? '#0f172a' : 'white',
                  color: statusFilter === st ? 'white' : '#4b5563',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st === 'all' ? `All (${history.length})` : `${STATUS_CONFIG[st]?.icon || ''} ${STATUS_CONFIG[st]?.label || st} (${counts[st] || 0})`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="Buscar por código QR ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '260px', fontSize: '14px' }}
            />

            {/* Quick Bulk Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                Selecionados: {selectedHistoryTags.length}
              </span>
              <button
                disabled={selectedHistoryTags.length === 0 || bulkActionLoading}
                onClick={() => handleBulkStatusUpdate('manufactured')}
                className="btn"
                style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '7px 14px', fontSize: '12px', opacity: selectedHistoryTags.length === 0 ? 0.5 : 1 }}
              >
                🏭 Marcar como Manufactured
              </button>
              <button
                disabled={selectedHistoryTags.length === 0 || bulkActionLoading}
                onClick={() => handleBulkStatusUpdate('in_stock')}
                className="btn"
                style={{ backgroundColor: '#10b981', color: 'white', padding: '7px 14px', fontSize: '12px', opacity: selectedHistoryTags.length === 0 ? 0.5 : 1 }}
              >
                📦 Marcar como In Stock
              </button>
              <button
                disabled={selectedHistoryTags.length === 0 || bulkActionLoading}
                onClick={() => handleBulkStatusUpdate('sold')}
                className="btn"
                style={{ backgroundColor: '#f97316', color: 'white', padding: '7px 14px', fontSize: '12px', opacity: selectedHistoryTags.length === 0 ? 0.5 : 1 }}
              >
                🛍️ Marcar como Sold
              </button>
              {selectedHistoryTags.length > 0 && (
                <button
                  onClick={() => loadHistoryToPrintGrid(selectedHistoryTags)}
                  className="btn btn-outline"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                >
                  🖨️ Re-Imprimir
                </button>
              )}
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedHistoryTags(filteredHistory);
                        else setSelectedHistoryTags([]);
                      }}
                      checked={selectedHistoryTags.length > 0 && selectedHistoryTags.length === filteredHistory.length}
                    />
                  </th>
                  <th>Código QR</th>
                  <th>Tipo</th>
                  <th>Status Lifecycle</th>
                  <th>Data de Geração</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Carregando histórico...</td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Nenhum código encontrado.</td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    const isSelected = selectedHistoryTags.some((t) => t.id === item.id);
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.unregistered;
                    return (
                      <tr key={item.id} style={{ background: isSelected ? '#eff6ff' : 'transparent' }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHistoryTags([...selectedHistoryTags, item]);
                              } else {
                                setSelectedHistoryTags(selectedHistoryTags.filter((t) => t.id !== item.id));
                              }
                            }}
                          />
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#111827' }}>
                          {item.qr_code}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {item.type?.replace('_', ' ')}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#6b7280' }}>
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 & 4: FAST SCANNER (IN STOCK & SOLD) */}
      {(activeTab === 'in_stock_scanner' || activeTab === 'sold_scanner') && (
        <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="admin-card" style={{ padding: '24px', border: activeTab === 'in_stock_scanner' ? '2px solid #10b981' : '2px solid #f97316' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem' }}>{activeTab === 'in_stock_scanner' ? '📦' : '🛍️'}</span>
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#0f172a' }}>
                  {activeTab === 'in_stock_scanner' ? 'Scanner de Entrada no Estoque (In Stock)' : 'Scanner de Despacho ao Cliente (Sold)'}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Use um leitor de código de barras USB/Bluetooth ou digite o código QR. O status é alterado instantaneamente a cada bipe.
                </p>
              </div>
            </div>

            <form onSubmit={handleFastScannerSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input
                ref={scannerInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Aguardando bipe ou digite o código B2M-XXXXXX..."
                disabled={scanLoading}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '2px solid #0f172a',
                  fontSize: '1.1rem',
                  fontFamily: 'monospace',
                  fontWeight: '700'
                }}
              />
              <button
                type="submit"
                disabled={scanLoading}
                className="btn"
                style={{
                  backgroundColor: activeTab === 'in_stock_scanner' ? '#10b981' : '#f97316',
                  color: 'white',
                  padding: '0 24px',
                  fontWeight: '700',
                  fontSize: '15px'
                }}
              >
                {scanLoading ? 'Processando...' : '⚡ Confirmar Bipe'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', margin: 0 }}>
                Sessão Atual de Bipes ({scanLogs.length} itens processados)
              </h3>
              {scanLogs.length > 0 && (
                <button onClick={() => setScanLogs([])} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>
                  Limpar Logs
                </button>
              )}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '350px', overflowY: 'auto' }}>
              {scanLogs.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  Aguardando o primeiro bipe com o scanner...
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '8px 12px' }}>Hora</th>
                      <th style={{ padding: '8px 12px' }}>Código QR</th>
                      <th style={{ padding: '8px 12px' }}>Status Atualizado</th>
                      <th style={{ padding: '8px 12px' }}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: log.success ? '#ffffff' : '#fef2f2' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{log.time}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: '700' }}>{log.code}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {log.success ? (
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: activeTab === 'in_stock_scanner' ? '#d1fae5' : '#ffedd5', color: activeTab === 'in_stock_scanner' ? '#065f46' : '#9a3412' }}>
                              {activeTab === 'in_stock_scanner' ? '📦 IN STOCK' : '🛍️ SOLD'}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: log.success ? '#16a34a' : '#dc2626' }}>
                          {log.success ? '✅ Atualizado com Sucesso' : `❌ ${log.error}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
