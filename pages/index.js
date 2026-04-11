import { useState, useEffect, useMemo, useCallback } from 'react'

import Head from 'next/head'
import { supabase } from '../supabaseClient'
import RecordModal from '../components/RecordModal'
import ConfirmModal from '../components/ConfirmModal'
import CatalogModal from '../components/CatalogModal'
import DetailModal from '../components/DetailModal'
import { useToast, ToastContainer } from '../components/Toast'

// ─── Helpers ────────────────────────────────────────────────
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

// ─── Main Component ──────────────────────────────────────────
export default function Home() {
  const { toasts, addToast } = useToast()

  const [registros, setRegistros] = useState([])
  const [catalogos, setCatalogos] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & filters
  const [search, setSearch] = useState('')
  const [filterAccion, setFilterAccion] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterResponsable, setFilterResponsable] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')

  // Sort
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('desc')

  // Modals
  const [showRecord, setShowRecord] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showCatalog, setShowCatalog] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)

  // ─── Load data ──────────────────────────────────────────────
  const loadCatalogos = useCallback(async () => {
    const { data } = await supabase.from('catalogos').select('*').order('valor')
    setCatalogos(data || [])
  }, [])

  const loadRegistros = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('registros')
      .select(`
        id, fecha, descripcion, hipervinculo, comentarios, created_at,
        accion:accion_id(id, valor),
        estado:estado_id(id, valor),
        responsable:responsable_id(id, valor)
      `)
      .order('fecha', { ascending: false })

    if (error) {
      addToast('Error al cargar datos: ' + error.message, 'error')
    } else {
      setRegistros(data || [])
    }
    setLoading(false)
  }, [addToast])

  useEffect(() => {
    loadCatalogos()
    loadRegistros()
  }, [loadCatalogos, loadRegistros])

  // ─── Filter & Sort ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = registros

    // Full text search
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        [r.fecha, r.descripcion, r.hipervinculo, r.comentarios,
          r.accion?.valor, r.estado?.valor, r.responsable?.valor]
          .some(v => v && v.toLowerCase().includes(q))
      )
    }

    // Filters
    if (filterAccion) rows = rows.filter(r => r.accion?.id === filterAccion)
    if (filterEstado) rows = rows.filter(r => r.estado?.id === filterEstado)
    if (filterResponsable) rows = rows.filter(r => r.responsable?.id === filterResponsable)
    if (filterFechaDesde) rows = rows.filter(r => r.fecha >= filterFechaDesde)
    if (filterFechaHasta) rows = rows.filter(r => r.fecha <= filterFechaHasta)

    // Sort
    rows = [...rows].sort((a, b) => {
      let va, vb
      if (sortField === 'fecha') { va = a.fecha || ''; vb = b.fecha || '' }
      else if (sortField === 'accion') { va = a.accion?.valor || ''; vb = b.accion?.valor || '' }
      else if (sortField === 'estado') { va = a.estado?.valor || ''; vb = b.estado?.valor || '' }
      else if (sortField === 'responsable') { va = a.responsable?.valor || ''; vb = b.responsable?.valor || '' }
      else if (sortField === 'descripcion') { va = a.descripcion || ''; vb = b.descripcion || '' }
      else { va = ''; vb = '' }

      const cmp = va.localeCompare(vb, 'es', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [registros, search, filterAccion, filterEstado, filterResponsable, filterFechaDesde, filterFechaHasta, sortField, sortDir])

  // ─── Sort toggle ────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="sort-arrow" style={{ opacity: 0.25 }}>↕</span>
    return <span className="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ─── CRUD ───────────────────────────────────────────────────
  const handleSave = async (form) => {
    if (editRecord?.id) {
      const { error } = await supabase.from('registros').update(form).eq('id', editRecord.id)
      if (error) { addToast('Error al actualizar: ' + error.message, 'error'); return }
      addToast('Registro actualizado correctamente')
    } else {
      const { error } = await supabase.from('registros').insert(form)
      if (error) { addToast('Error al crear: ' + error.message, 'error'); return }
      addToast('Registro creado correctamente')
    }
    setShowRecord(false)
    setEditRecord(null)
    loadRegistros()
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const { error } = await supabase.from('registros').delete().eq('id', confirmDelete)
    if (error) { addToast('Error al eliminar: ' + error.message, 'error') }
    else { addToast('Registro eliminado') }
    setConfirmDelete(null)
    loadRegistros()
  }

  const openNew = () => { setEditRecord(null); setShowRecord(true) }
  const openEdit = (r) => { setEditRecord(r); setShowRecord(true) }

  const clearFilters = () => {
    setSearch(''); setFilterAccion(''); setFilterEstado('')
    setFilterResponsable(''); setFilterFechaDesde(''); setFilterFechaHasta('')
  }

  const hasFilters = search || filterAccion || filterEstado || filterResponsable || filterFechaDesde || filterFechaHasta

  // ─── Print ──────────────────────────────────────────────────
  const handlePrint = () => window.print()

  // ─── Catalog helpers ────────────────────────────────────────
  const acciones = catalogos.filter(c => c.tipo === 'accion')
  const estados = catalogos.filter(c => c.tipo === 'estado')
  const responsables = catalogos.filter(c => c.tipo === 'responsable')

  // ─── Render ─────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>GestorDB</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Print header (visible only when printing) */}
      <div className="print-header">
        <h1>Informe de Registros</h1>
        <p>Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} · {filtered.length} registros</p>
        {hasFilters && <p style={{ marginTop: 4, fontSize: 10 }}>
          {search && `Búsqueda: "${search}" · `}
          {filterAccion && `Acción: ${acciones.find(a=>a.id===filterAccion)?.valor} · `}
          {filterEstado && `Estado: ${estados.find(e=>e.id===filterEstado)?.valor} · `}
          {filterResponsable && `Responsable: ${responsables.find(r=>r.id===filterResponsable)?.valor}`}
        </p>}
      </div>

      <div className="app-shell">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <span className="dot" />
            GestorDB
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCatalog(true)}>⚙ Catálogos</button>
            <button className="btn btn-sm" onClick={handlePrint}>🖨 Imprimir</button>
            <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nuevo registro</button>
          </div>
        </header>

        {/* Main */}
        <main className="main">

          {/* Search */}
          <div className="search-section">
            <div className="search-bar-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Buscar en todos los campos: descripción, acción, estado, responsable, comentarios..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <span className="filter-label">Filtrar:</span>

            <select className="filter-select" value={filterAccion} onChange={e => setFilterAccion(e.target.value)}>
              <option value="">Acción: todas</option>
              {acciones.map(a => <option key={a.id} value={a.id}>{a.valor}</option>)}
            </select>

            <select className="filter-select" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
              <option value="">Estado: todos</option>
              {estados.map(e => <option key={e.id} value={e.id}>{e.valor}</option>)}
            </select>

            <select className="filter-select" value={filterResponsable} onChange={e => setFilterResponsable(e.target.value)}>
              <option value="">Responsable: todos</option>
              {responsables.map(r => <option key={r.id} value={r.id}>{r.valor}</option>)}
            </select>

            <input
              type="date"
              className="filter-date"
              value={filterFechaDesde}
              onChange={e => setFilterFechaDesde(e.target.value)}
              title="Fecha desde"
            />
            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>→</span>
            <input
              type="date"
              className="filter-date"
              value={filterFechaHasta}
              onChange={e => setFilterFechaHasta(e.target.value)}
              title="Fecha hasta"
            />

            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Limpiar</button>
            )}

            <div className="sort-group">
              <span className="filter-label">Ordenar:</span>
              <button
                className={`btn btn-sm ${sortField === 'fecha' ? 'btn-primary' : ''}`}
                onClick={() => handleSort('fecha')}
              >
                Fecha {sortField === 'fecha' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`btn btn-sm ${sortField === 'accion' ? 'btn-primary' : ''}`}
                onClick={() => handleSort('accion')}
              >
                A–Z Acción {sortField === 'accion' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`btn btn-sm ${sortField === 'estado' ? 'btn-primary' : ''}`}
                onClick={() => handleSort('estado')}
              >
                A–Z Estado {sortField === 'estado' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <span><span className="count">{filtered.length}</span> registros</span>
            {hasFilters && <span style={{ color: 'var(--warn)', fontSize: '0.78rem' }}>· Filtros activos</span>}
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
              Ordenado por <strong style={{ color: 'var(--text2)' }}>{sortField}</strong> {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className={`sortable ${sortField === 'fecha' ? 'sort-active' : ''}`} onClick={() => handleSort('fecha')}>
                      Fecha <SortIcon field="fecha" />
                    </th>
                    <th className={`sortable ${sortField === 'accion' ? 'sort-active' : ''}`} onClick={() => handleSort('accion')}>
                      Acción <SortIcon field="accion" />
                    </th>
                    <th className={`sortable ${sortField === 'estado' ? 'sort-active' : ''}`} onClick={() => handleSort('estado')}>
                      Estado <SortIcon field="estado" />
                    </th>
                    <th className={`sortable ${sortField === 'responsable' ? 'sort-active' : ''}`} onClick={() => handleSort('responsable')}>
                      Responsable <SortIcon field="responsable" />
                    </th>
                    <th className={`sortable ${sortField === 'descripcion' ? 'sort-active' : ''}`} onClick={() => handleSort('descripcion')}>
                      Descripción <SortIcon field="descripcion" />
                    </th>
                    <th>Enlace</th>
                    <th>Comentarios</th>
                    <th style={{ width: 90 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="loading-row">
                      <td colSpan={8}>
                        <span className="spinner" />Cargando registros...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <div className="icon">📭</div>
                          <h3>{hasFilters ? 'Sin resultados' : 'No hay registros'}</h3>
                          <p>{hasFilters ? 'Prueba a ajustar los filtros de búsqueda' : 'Crea el primer registro con el botón + Nuevo registro'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.id} className="clickable-row" onClick={() => setDetailRecord(r)}>
                        <td className="fecha-cell" data-label="Fecha">{fmtDate(r.fecha)}</td>
                        <td data-label="Acción">
                          {r.accion?.valor
                            ? <span className="badge badge-accion">{r.accion.valor}</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td data-label="Estado">
                          {r.estado?.valor
                            ? <span className={estatusBadgeClass(r.estado.valor)}>{r.estado.valor}</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td data-label="Responsable">
                          {r.responsable?.valor
                            ? <span className="badge badge-responsable">{r.responsable.valor}</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td className="description-cell" data-label="Descripción" title={r.descripcion}>{r.descripcion || '—'}</td>
                        <td className="link-cell" data-label="Enlace">
                          {r.hipervinculo
                            ? <a href={r.hipervinculo} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>🔗 Abrir</a>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td className="description-cell" data-label="Comentarios" title={r.comentarios}>{r.comentarios || '—'}</td>
                        <td data-label="Acciones">
                          <div className="actions-cell">
                            <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={e => { e.stopPropagation(); openEdit(r) }}>✏️</button>
                            <button className="btn btn-danger btn-icon btn-sm" title="Eliminar" onClick={e => { e.stopPropagation(); setConfirmDelete(r.id) }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showRecord && (
        <RecordModal
          record={editRecord}
          catalogos={catalogos}
          onSave={handleSave}
          onClose={() => { setShowRecord(false); setEditRecord(null) }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
      {showCatalog && (
        <CatalogModal
          catalogos={catalogos}
          onClose={() => setShowCatalog(false)}
          onRefresh={loadCatalogos}
        />
      )}

      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={r => { openEdit(r) }}
          onDelete={id => { setDetailRecord(null); setConfirmDelete(id) }}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}

// Force Next.js to render this page at request time, not at build time
export async function getServerSideProps() {
  return { props: {} }
}
