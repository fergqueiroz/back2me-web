'use client';

import { useState, useEffect } from 'react';
import { generateQRTags, getQRGeneratorHistory } from '../actions';
import { QRCodeSVG } from 'qrcode.react';

export default function QRGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryTags, setSelectedHistoryTags] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const res = await getQRGeneratorHistory(300);
    if (res.tags) {
      setHistory(res.tags);
    }
    setHistoryLoading(false);
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

  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.qr_code.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    );
  });

  const loadHistoryToPrintGrid = (tagsToPrint) => {
    setTags(tagsToPrint);
    setActiveTab('generator');
  };

  return (
    <div className="admin-page qr-generator-page">
      {/* Page Header */}
      <div className="admin-page-header no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="admin-page-title">Bulk QR Generator & Audit History</h1>
            <p className="admin-page-subtitle">
              Gere códigos QR 100% únicos salvos automaticamente no histórico e banco de dados.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ padding: '6px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Unicidade 100% Garantida
            </span>
            <span style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              💾 Histórico Auditado ({history.length} tags)
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '12px 20px',
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
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #f97316' : '3px solid transparent',
            background: 'none',
            fontWeight: '700',
            fontSize: '14px',
            color: activeTab === 'history' ? '#f97316' : '#6b7280',
            cursor: 'pointer'
          }}
        >
          📜 Histórico de Códigos ({history.length})
        </button>
      </div>

      {/* TAB 1: GENERATOR */}
      {activeTab === 'generator' && (
        <>
          <div className="admin-card no-print" style={{ marginBottom: '32px' }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>Merchandise Type</label>
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
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Códigos registrados e salvos com sucesso no histórico.</p>
                </div>
                <button onClick={handlePrint} className="btn" style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', fontWeight: '600' }}>
                  🖨️ Imprimir / Salvar PDF
                </button>
              </div>

              <div className="qr-print-grid">
                {tags.map((tag) => (
                  <div key={tag.id} className="qr-print-item">
                    <QRCodeSVG 
                      value={`https://www.back2meglobal.com/scan/${tag.id}`} 
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
              <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Preencha o formulário acima para gerar novos códigos ou consulte a aba Histórico para reimprimir antigos.</p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <input
              type="text"
              placeholder="Buscar por código QR ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', width: '280px', fontSize: '14px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedHistoryTags.length > 0 && (
                <button
                  onClick={() => loadHistoryToPrintGrid(selectedHistoryTags)}
                  className="btn"
                  style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', fontSize: '14px' }}
                >
                  🖨️ Imprimir Selecionados ({selectedHistoryTags.length})
                </button>
              )}
              <button
                onClick={() => loadHistoryToPrintGrid(filteredHistory)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                🖨️ Carregar Todos para Impressão ({filteredHistory.length})
              </button>
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
                  <th>Status</th>
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
                            backgroundColor: item.status === 'active' ? '#d1fae5' : '#f3f4f6',
                            color: item.status === 'active' ? '#065f46' : '#4b5563',
                            textTransform: 'uppercase'
                          }}>
                            {item.status}
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
    </div>
  );
}
