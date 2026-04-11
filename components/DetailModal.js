function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function estatusBadgeClass(valor) {
  if (!valor) return 'badge badge-estado-default'
  const v = valor.toLowerCase()
  if (v.includes('complet') || v.includes('cerrad')) return 'badge badge-estado-completado'
  if (v.includes('progres') || v.includes('activ')) return 'badge badge-estado-progreso'
  if (v.includes('pendien') || v.includes('espera')) return 'badge badge-estado-pendiente'
  if (v.includes('bloquea') || v.includes('cancel')) return 'badge badge-estado-bloqueado'
  return 'badge badge-estado-default'
}

export default function DetailModal({ record: r, onClose, onEdit, onDelete }) {
  if (!r) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal detail-modal">

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="modal-title" style={{ fontSize: '0.85rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {fmtDate(r.fecha)}
            </span>
            {r.accion?.valor && <span className="badge badge-accion">{r.accion.valor}</span>}
            {r.estado?.valor && <span className={estatusBadgeClass(r.estado.valor)}>{r.estado.valor}</span>}
            {r.responsable?.valor && <span className="badge badge-responsable">{r.responsable.valor}</span>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Descripción */}
          <div className="detail-section">
            <div className="detail-label">Descripción</div>
            <div className="detail-content">
              {r.descripcion
                ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.descripcion}</p>
                : <span style={{ color: 'var(--text3)' }}>Sin descripción</span>}
            </div>
          </div>

          {/* Comentarios */}
          <div className="detail-section">
            <div className="detail-label">Comentarios</div>
            <div className="detail-content">
              {r.comentarios
                ? <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.comentarios}</p>
                : <span style={{ color: 'var(--text3)' }}>Sin comentarios</span>}
            </div>
          </div>

          {/* Hipervínculo */}
          {r.hipervinculo && (
            <div className="detail-section">
              <div className="detail-label">Hipervínculo</div>
              <div className="detail-content">
                <a
                  href={r.hipervinculo}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent)', wordBreak: 'break-all', fontSize: '0.82rem' }}
                >
                  🔗 {r.hipervinculo}
                </a>
              </div>
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="detail-section">
              <div className="detail-label">Fecha</div>
              <div className="detail-content" style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtDate(r.fecha)}</div>
            </div>
            <div className="detail-section">
              <div className="detail-label">Acción</div>
              <div className="detail-content">
                {r.accion?.valor
                  ? <span className="badge badge-accion">{r.accion.valor}</span>
                  : <span style={{ color: 'var(--text3)' }}>—</span>}
              </div>
            </div>
            <div className="detail-section">
              <div className="detail-label">Estado</div>
              <div className="detail-content">
                {r.estado?.valor
                  ? <span className={estatusBadgeClass(r.estado.valor)}>{r.estado.valor}</span>
                  : <span style={{ color: 'var(--text3)' }}>—</span>}
              </div>
            </div>
            <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
              <div className="detail-label">Responsable</div>
              <div className="detail-content">
                {r.responsable?.valor
                  ? <span className="badge badge-responsable">{r.responsable.valor}</span>
                  : <span style={{ color: 'var(--text3)' }}>—</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
          <button className="btn btn-sm" onClick={() => { onDelete(r.id); onClose() }}
            style={{ color: 'var(--danger)', borderColor: 'transparent' }}>
            🗑 Eliminar
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { onEdit(r); onClose() }}>
            ✏️ Editar
          </button>
        </div>
      </div>
    </div>
  )
}
