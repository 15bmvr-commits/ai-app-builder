type HeaderProps = {
  title: string
  description: string
  connectionStatus: string
}

function Header({
  title,
  description,
  connectionStatus,
}: HeaderProps) {
  return (
    <header className="header">

      <div>
        <h1>{title}</h1>

        <p>
          {description}
        </p>
      </div>

      <div className="status">
        <span className="status-dot"></span>
        {connectionStatus}
      </div>

    </header>
  )
}

export default Header