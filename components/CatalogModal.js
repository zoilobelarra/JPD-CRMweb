import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CatalogModal({ catalogos, onClose, onRefresh }) {
  const [newItem, setNewItem] = useState({ tipo: 'accion', valor: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const acciones = catalogos.filter(c => c.tipo === 'accion')
  const estados = catalogos.filter(c => c.tipo === 'estado')
  const responsables = catalogos.filter(c => c.tipo === 'responsable')

  const handleAdd = async () => {
    if (!newItem.valor.trim()) return
    setSaving(true)
    const { error } = await supabase.from('catalogos').insert({ tipo: newItem.tipo, valor: newItem.valor.trim() })
    if (!error) { setNewItem(n => ({ ...n, valor: '' })); onRefresh() }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    await supabase.from('catalogos').delete().eq('id', id)
    onRefresh()
    setDeleting(null)
  }

  const Section = ({ title, items, color }) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '8px', fontWeight: 500 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '3px 10px 3px 10px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text2)' }}>{item.valor}</span>
            <button
              onClick={() => handleDelete(item.id)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 0 0 4px', fontSize: '0.75rem', lineHeight: 1, opacity: deleting === item.id ? 0.5 : 1 }}
            >✕</button>
          </div>
        ))}
        {items.length === 0 && <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Sin elementos</span>}
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title">⚙️ Gestionar catálogos</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <Section title="Acciones" items={acciones} />
          <Section title="Estados" items={estados} />
          <Section title="Responsables" items={responsables} />

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: '0 0 140px' }}>
              <label className="form-label">Tipo</label>
              <select className="form-select" value={newItem.tipo} onChange={e => setNewItem(n => ({ ...n, tipo: e.target.value }))}>
                <option value="accion">Acción</option>
                <option value="estado">Estado</option>
                <option value="responsable">Responsable</option>
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Nuevo valor</label>
              <input
                className="form-input"
                placeholder="Escribe el valor..."
                value={newItem.valor}
                onChange={e => setNewItem(n => ({ ...n, valor: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving} style={{ marginBottom: '0', height: '36px' }}>
              + Añadir
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  )
}
