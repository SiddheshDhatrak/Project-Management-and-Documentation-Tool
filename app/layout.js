import './global.css'

export const metadata = {
  title: 'Project Management & Documentation Tool',
  description: 'Confluence-style editor with Jira-style Kanban boards for collaborative project management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}