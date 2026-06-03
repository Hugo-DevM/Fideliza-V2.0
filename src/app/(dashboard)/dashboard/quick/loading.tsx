const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="space-y-2">
        <div className={`h-3 w-16 ${S}`} />
        <div className={`h-7 w-48 ${S}`} />
        <div className={`h-3.5 w-80 ${S}`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">

        {/* QuickRegister card */}
        <div className="space-y-4">
          {/* Search box */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-3">
            <div className={`h-3.5 w-28 ${S}`} />
            <div className="flex gap-2">
              <div className={`h-10 flex-1 ${S}`} />
              <div className={`h-10 w-24 ${S}`} />
            </div>
          </div>

          {/* Customer + action card */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
            {/* Customer header */}
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 shrink-0 rounded-2xl ${S}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-36 ${S}`} />
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-20 ${S}`} />
                  <div className={`h-5 w-14 rounded-full ${S}`} />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex gap-1 rounded-xl p-1 bg-gray-50 dark:bg-[#0d0f17]`}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex-1 h-8 rounded-lg ${S}`} />
              ))}
            </div>

            {/* Stamp grid */}
            <div className="flex flex-wrap gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-11 w-11 rounded-full ${S}`} />
              ))}
            </div>

            {/* Button */}
            <div className={`h-11 w-full ${S}`} />
          </div>
        </div>

        {/* VerifyVoucher card */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-3">
          <div className={`h-3.5 w-36 ${S}`} />
          <div className="flex gap-2">
            <div className={`h-10 flex-1 ${S}`} />
            <div className={`h-10 w-24 ${S}`} />
          </div>
        </div>

      </div>
    </div>
  );
}
