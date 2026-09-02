type ComingSoonProps = {
  icon: string
  title: string
  description: string
}

// Página genérica para módulos ainda não implementados.
// Evita ecrãs em branco quando o utilizador clica em itens
// do menu que ainda não têm funcionalidade associada.
function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  )
}

export default ComingSoon
