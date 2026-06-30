import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="text-center md:text-left">
            <p className="mb-0.5 font-medium text-gray-700 dark:text-gray-300">StegoAuth Comparator</p>
            <p className="text-xs">
              Department of Cyber Security Science, Federal University of Technology, Minna, Niger State, Nigeria
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/documentation"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Documentation &amp; Glossary
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span>
              &copy; {new Date().getFullYear()} StegoAuth Comparator
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
