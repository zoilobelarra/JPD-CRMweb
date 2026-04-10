import { useState, useEffect } from 'react'

export default function RecordModal({ record, catalogos, onSave, onClose }) {
  const isEdit = !!record?.id
  const [form, setForm] = useState({
    fecha: '',
    accion_id: '',
    estado_id: '',
    responsable_id: '',
    descripcion: '',
    hipervinculo: '',
    comentarios: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (record) {
      setForm({
        fecha: record.fecha || '',
        accion_id: record.accion_id || '',
        estado_id: record.estado_id || '',
        responsable_id: record.responsable_id || '',
        descripcion: record.descripcion || '',
        hipervinculo: record.hipervinculo || '',
        comentarios: record.comentarios || '',
      })
    }
  }, [record])

  const acciones = catalogos.filter(c => c.tipo === 'accion')
  const estados = catalogos.filter(c => c.tipo === 'estado')
  const responsables = catalogos.filter(c => c.tipo === 'responsable')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.fecha) return alert('La fecha es obligatoria')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '✏️ Editar registro' : '+ Nuevo registro'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Fecha *</label>
              <input
                type="date"
                name="fecha"
                className="form-input"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Acción</label>
              <select name="accion_id" className="form-select" value={form.accion_id} onChange={handleChange}>
                <option value="">— seleccionar —</option>
                {acciones.map(a => (
                  <option key={a.id} value={a.id}>{a.valor}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Estado</label>
              <select name="estado_id" className="form-select" value={form.estado_id} onChange={handleChange}>
                <option value="">— seleccionar —</option>
                {estados.map(e => (
                  <option key={e.id} value={e.id}>{e.valor}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Responsable</label>
              <select name="responsable_id" className="form-select" value={form.responsable_id} onChange={handleChange}>
                <option value="">— seleccionar —</option>
                {responsables.map(r => (
                  <option key={r.id} value={r.id}>{r.valor}</option>
                ))}
              </select>
            </div>

            <div className="form-field full">
              <label className="form-label">Descripción</label>
              <input
                type="text"
                name="descripcion"
                className="form-input"
                placeholder="Descripción del registro..."
                value={form.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className="form-field full">
              <label className="form-label">Hipervínculo</label>
              <input
                type="url"
                name="hipervinculo"
                className="form-input"
                placeholder="https://..."
                value={form.hipervinculo}
                onChange={handleChange}
              />
            </div>

            <div className="form-field full">
              <label className="form-label">Comentarios</label>
              <textarea
                name="comentarios"
                className="form-textarea"
                placeholder="Comentarios adicionales..."
                value={form.comentarios}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner" style={{width:14,height:14}} />Guardando...</> : (isEdit ? '💾 Guardar cambios' : '+ Crear registro')}
          </button>
        </div>
      </div>
    </div>
  )
}
