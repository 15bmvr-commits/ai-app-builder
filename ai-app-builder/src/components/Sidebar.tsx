type SidebarProps = {
  currentPage: string
  setCurrentPage: (page: string) => void
  profile: {
    full_name?: string | null
    role?: string | null
  } | null
}

function Sidebar({
  currentPage,
  setCurrentPage,
  profile,
}: SidebarProps) {
  const menuItems = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'condominiums', icon: '🏢', label: 'Condomínios' },
  { id: 'owners', icon: '👤', label: 'Proprietários' },
  { id: 'fractions', icon: '🏠', label: 'Frações' },
  { id: 'people', icon: '👥', label: 'Condóminos' },
  { id: 'fees', icon: '💰', label: 'Quotas' },
  { id: 'current-accounts', icon: '💳', label: 'Conta Corrente' },
  { id: 'expenses', icon: '🧾', label: 'Despesas' },
  { id: 'maintenance', icon: '🔧', label: 'Manutenção' },
  { id: 'meetings', icon: '🏛️', label: 'Assembleias' },
  { id: 'documents', icon: '📄', label: 'Documentos' },
  { id: 'settings', icon: '⚙️', label: 'Definições' },
]

  const roleLabel =
    profile?.role === 'admin'
      ? 'Administrador'
      : profile?.role === 'manager'
        ? 'Gestor'
        : profile?.role === 'owner'
          ? 'Proprietário'
          : 'Condómino'

  const userName =
    profile?.full_name ?? 'Utilizador'

  return (
    <aside className="sidebar">

      <div className="logo">
        <span>🏢</span>
        <strong>Gestão de Condomínios</strong>
      </div>

      <nav>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              currentPage === item.id
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setCurrentPage(item.id)
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">

        <div className="user">

          <div className="avatar">
            {userName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>{userName}</strong>
            <small>{roleLabel}</small>
          </div>

        </div>

      </div>

    </aside>
  )
}

export default Sidebar
