// Placeholder icon SVGs to avoid needing external assets
const GithubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.3l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.12l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.3z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="dl-icon dl-icon--apple" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000">
    <path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Helper for harness grid
const harnesses = [
  { name: 'Claude Code', type: 'Anthropic', id: 'claude' },
  { name: 'Codex', type: 'OpenAI', id: 'codex' },
  { name: 'OpenCode', type: 'Community', id: 'opencode' },
  { name: 'Cursor', type: 'Anysphere', id: 'cursor' },
  { name: 'Grok', type: 'xAI', id: 'grok' },
];

export function LandingPage() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand">
            <span className="nav-brand-name">Mux</span>
          </a>
          <div className="nav-right">
            <a className="nav-stars" href="https://github.com/pingdotgg/mux" target="_blank" rel="noopener noreferrer">
              <GithubIcon />
              <span><strong>14k+</strong> GitHub stars</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="main">
        {/* HERO */}
        <section className="hero">
          <div className="hero-grid" aria-hidden="true"></div>
          
          <div className="hero-float" aria-hidden="true">
            {harnesses.map((h) => (
              <span key={h.id} className={`hero-float-mark hf-${h.id}`} title={h.name}>
                {/* Fallback to initials since we don't have images locally */}
                <div style={{ color: 'var(--fg)', fontWeight: 'bold', fontSize: '18px' }}>
                  {h.name[0]}
                </div>
              </span>
            ))}
          </div>

          <div className="container hero-inner">
            <h1 className="hero-title display">
              The open-source<br/>control plane<br/>for coding agents.
            </h1>
            <p className="hero-sub">
              Orchestrate Claude Code, Codex, OpenCode, Cursor, and Grok from one surface. Bring your own subscription. Fork the whole thing.
            </p>
            <div className="hero-actions">
              <a id="download-btn" href="/signup" className="btn btn-primary btn-lg">
                <AppleIcon />
                <span id="download-label">Create account</span>
              </a>
              <a className="hero-source-link" href="#" target="_blank" rel="noopener noreferrer">
                <svg className="hero-source-mark" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 007.86 10.93c.58.1.79-.25.79-.56v-2c-3.2.69-3.88-1.37-3.88-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.67 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.18a10.96 10.96 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.57.23 2.73.11 3.02.74.8 1.18 1.83 1.18 3.08 0 4.41-2.7 5.38-5.27 5.66.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z"></path>
                </svg>
                <span>Steal our code (legally)</span>
                <svg className="hero-source-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M8 7h9v9"></path>
                </svg>
              </a>
              <p className="hero-mobile-line">
                Also on your phone: <a href="#">iOS</a><span>·</span><a href="#">Android</a>
              </p>
            </div>

            <div className="hero-preview">
              <div className="hero-screenshot-frame">
                <div className="hero-screenshot-inner">
                  {/* Faux Window UI */}
                  <div className="app-titlebar">
                    <div className="traffic-dot red"></div>
                    <div className="traffic-dot yellow"></div>
                    <div className="traffic-dot green"></div>
                    <div className="app-titlebar-title">Mux — Workspace</div>
                  </div>
                  <div className="app-body">
                    <div className="app-sidebar">
                      <div className="sidebar-item active">
                        <div className="sidebar-dot" style={{background: '#28c840'}}></div>
                        Current Thread
                      </div>
                      <div className="sidebar-item">
                        <div className="sidebar-dot" style={{background: 'var(--fg-dim)'}}></div>
                        Previous Task
                      </div>
                    </div>
                    <div className="app-main">
                      <div className="chat-header">Claude 3.5 Sonnet</div>
                      <div className="chat-messages">
                        <div className="msg">
                          <div className="msg-avatar user">U</div>
                          <div className="msg-content">Can you refactor <span className="highlight">index.ts</span> to use the new connection manager?</div>
                        </div>
                        <div className="msg">
                          <div className="msg-avatar agent">A</div>
                          <div className="msg-content">
                            Sure! Here is the refactored code using <code>ConnectionManager</code>:
                            <br/><br/>
                            <div style={{background: '#111113', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '8px'}}>
                              <code style={{background: 'none', padding: 0}}>
                                import {'{'} ConnectionManager {'}'} from './core';<br/>
                                <br/>
                                const mgr = new ConnectionManager();<br/>
                                mgr.connect();
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="chat-input-bar">
                        <div className="chat-input-fake">Type a message...</div>
                        <button className="chat-send-btn">Send</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ENDORSEMENTS */}
        <section className="sec-endorsements">
          <div className="container">
            <div className="endorsements-head">
              <h2>Tolerated by over <span className="endorsements-count">100,000</span> devs</h2>
              <p>Some of them even tweeted about it.</p>
            </div>
          </div>
          <div className="endorsement-carousel">
            <div className="endorsement-row">
              <div className="endorsement-track">
                <div className="endorsement-track-group">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={`end1-${i}`} className="endorsement-card">
                      <div className="endorsement-author">
                        <div className="endorsement-handle">@dev_user_{i}</div>
                      </div>
                      <p>Mux is actually amazing. The local control plane concept is exactly what I needed for managing my agent workflows.</p>
                    </div>
                  ))}
                </div>
                <div className="endorsement-track-group" aria-hidden="true">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={`end1-dup-${i}`} className="endorsement-card">
                      <div className="endorsement-author">
                        <div className="endorsement-handle">@dev_user_{i}</div>
                      </div>
                      <p>Mux is actually amazing. The local control plane concept is exactly what I needed for managing my agent workflows.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="endorsement-row is-reverse">
              <div className="endorsement-track">
                <div className="endorsement-track-group">
                  {[7, 8, 9, 10, 11, 12].map(i => (
                    <div key={`end2-${i}`} className="endorsement-card">
                      <div className="endorsement-author">
                        <div className="endorsement-handle">@happy_coder_{i}</div>
                      </div>
                      <p>I switched from standard web interfaces and never looked back. It's so fast.</p>
                    </div>
                  ))}
                </div>
                <div className="endorsement-track-group" aria-hidden="true">
                   {[7, 8, 9, 10, 11, 12].map(i => (
                    <div key={`end2-dup-${i}`} className="endorsement-card">
                      <div className="endorsement-author">
                        <div className="endorsement-handle">@happy_coder_{i}</div>
                      </div>
                      <p>I switched from standard web interfaces and never looked back. It's so fast.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HARNESSES */}
        <section className="sec-harness">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Integrations</span>
              <h2>Use your favorite models</h2>
              <p>We support all major foundation models and coding harnesses out of the box.</p>
            </div>
            <div className="harness-grid">
              {harnesses.map(h => (
                <div key={h.id} className="harness">
                  <div className="harness-mark">
                    {h.name[0]}
                  </div>
                  <div className="harness-meta">
                    <div className="harness-name">{h.name}</div>
                    <div className="harness-tag">{h.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OPEN SOURCE */}
        <section>
          <div className="container">
             <div className="open-head">
              <span className="eyebrow">Open Source</span>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, letterSpacing: '-0.035em' }}>Truly yours.</h2>
            </div>
            <div className="git-inner">
              <div className="git-visual">
                <div className="open-term tile">
                  <div className="open-term-head">
                    <span style={{background: '#ff5f57'}}></span>
                    <span style={{background: '#febc2e'}}></span>
                    <span style={{background: '#28c840'}}></span>
                    <div className="open-term-title">~ / dev / mux</div>
                  </div>
                  <div className="open-term-body">
                    <div><span className="prompt">❯</span> git clone https://github.com/pingdotgg/mux</div>
                    <div><span className="prompt">❯</span> cd mux</div>
                    <div><span className="prompt">❯</span> bun install</div>
                    <div className="dim">Resolving dependencies...</div>
                    <div className="dim">Done in 0.8s</div>
                    <div className="cursor"><span className="prompt">❯</span> <span className="caret"></span></div>
                  </div>
                </div>
              </div>
              
              <div className="open-pitch tile">
                <ul className="open-pitch-list">
                  <li>
                    <div className="open-pitch-mark"><CheckIcon /></div>
                    <span><strong>No vendor lock-in.</strong> Bring your own API keys or use your existing subscriptions.</span>
                  </li>
                  <li>
                    <div className="open-pitch-mark"><CheckIcon /></div>
                    <span><strong>Fully extensible.</strong> Build your own harnesses, plugins, and workflows on top of our core engine.</span>
                  </li>
                  <li>
                    <div className="open-pitch-mark"><CheckIcon /></div>
                    <span><strong>Local first.</strong> Your codebase stays on your machine until you decide otherwise.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="sec-cta">
          <div className="container cta-inner">
            <h2 className="cta-title display">Ready to take control?</h2>
            <p className="cta-sub">Join thousands of developers building faster with Mux.</p>
            <div className="cta-actions">
              <a href="#" className="btn btn-primary btn-lg">
                <AppleIcon /> Download for macOS
              </a>
              <a href="#" className="btn btn-ghost btn-lg">
                View Documentation
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
             <span>© 2026 Mux</span>
          </div>
          <div className="footer-links">
            <a href="#">GitHub</a>
            <a href="#">Twitter</a>
            <a href="#">Discord</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
