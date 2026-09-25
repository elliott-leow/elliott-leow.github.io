/* remounted on every navigation, so each page slides in under the last one */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>
}
