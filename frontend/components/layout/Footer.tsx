export default function Footer() {
  return (
    <footer className="border-t bg-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
        <p className="mb-1">
          Department of Cyber Security Science, Federal University of
          Technology, Minna, Niger State, Nigeria
        </p>
        <p>
          &copy; {new Date().getFullYear()} StegoAuth Comparator. All rights
          reserved.
        </p>
      </div>
    </footer>
  )
}
