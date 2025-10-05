// import { Switch, Route, Link, useLocation } from "wouter";
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { Search, Copy } from "lucide-react";
// import NotFound from "@/pages/not-found";
// import Home from "@/pages/home";
// import DuplicatesPage from "@/pages/duplicates";

// function Navigation() {
//   const [location] = useLocation();

//   return (
//     <nav className="bg-white shadow-sm border-b">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">
//           <div className="flex items-center space-x-8">
//             <Link href="/" className="flex items-center space-x-2">
//               <div className="text-xl font-bold text-gray-900">Question Bank</div>
//             </Link>

//             <div className="flex space-x-4">
//               <Link
//                 href="/"
//                 className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                   location === "/"
//                     ? "bg-blue-100 text-blue-700"
//                     : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//                 }`}
//               >
//                 <Search className="h-4 w-4" />
//                 <span>Search</span>
//               </Link>

//               <Link
//                 href="/duplicates"
//                 className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                   location === "/duplicates"
//                     ? "bg-blue-100 text-blue-700"
//                     : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//                 }`}
//               >
//                 <Copy className="h-4 w-4" />
//                 <span>Duplicates</span>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// function Router() {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navigation />
//       <Switch>
//         <Route path="/" component={Home} />
//         <Route path="/duplicates" component={DuplicatesPage} />
//         <Route component={NotFound} />
//       </Switch>
//     </div>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Router />
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;

import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Search, Copy, FileDown } from "lucide-react";
import { ExportProvider } from "@/contexts/ExportContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import DuplicatesPage from "@/pages/duplicates";
import ExportPage from "@/pages/export";

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-xl font-bold text-gray-900">
                Question Bank
              </div>
            </Link>

            <div className="flex space-x-4">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Link>

              <Link
                href="/duplicates"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/duplicates"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Copy className="h-4 w-4" />
                <span>Duplicates</span>
              </Link>

              <Link
                href="/export"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/export"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FileDown className="h-4 w-4" />
                <span>Export</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/duplicates" component={DuplicatesPage} />
        <Route path="/export" component={ExportPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExportProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ExportProvider>
    </QueryClientProvider>
  );
}

export default App;
