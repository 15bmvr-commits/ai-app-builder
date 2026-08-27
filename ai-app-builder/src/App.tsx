import { useState } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🤖</span>
          <strong>AI App Builder</strong>
        </div>

        <nav>
          <button className="nav-item active">
            <span>🏠</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>📁</span>
            Projetos
          </button>

          <button className="nav-item">
            <span>⚙️</span>
            Definições
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user">
            <div className="avatar">B</div>
            <div>
              <strong>Bruno</strong>
              <small>Administrador</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>Dashboard</h1>
            <p>Cria aplicações através de inteligência artificial.</p>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            Sistema online
          </div>
        </header>

        <section className="hero">
          <div className="hero-content">
            <span className="badge">✨ AI App Builder</span>

            <h2>
              O que queres
              <span> construir hoje?</span>
            </h2>

            <p>
              Descreve a aplicação que tens em mente.
              A nossa IA irá transformar os teus requisitos em código.
            </p>

            <div className="prompt-box">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex.: Cria uma aplicação de gestão de pedidos de IT..."
              />

              <div className="prompt-footer">
                <span>{prompt.length} caracteres</span>

                <button className="create-button">
                  ✨ Criar aplicação
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="projects">
          <div className="section-header">
            <div>
              <h3>Os teus projetos</h3>
              <p>Aplicações criadas através do AI App Builder.</p>
            </div>

            <button className="secondary-button">
              + Novo projeto
            </button>
          </div>

          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Ainda não tens projetos</h3>
            <p>
              Escreve acima o que queres construir
              e cria a tua primeira aplicação.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App