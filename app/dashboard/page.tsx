export default function Dashboard() {
    return (
        <div className="container px-32 grid grid-cols-8 gap-4">
            <div className="grid-cols-subgrid col-span-full flex flex-row items-center gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="ml-2 font-semibold text-lg">User Analytics</h1>
                    <div className="flex flex-row items-center gap-4">
                        <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                            <h2 className="font-bold text-2xl text-l-200">50</h2>
                            <h3 className="text-sm text-l-200/90">Credit Score</h3>
                        </div>
                    </div>
                </div>

                <div className="w-[1px] h-[80%] bg-l-100/[0.2] mx-6"></div>

                <div className="flex flex-col gap-1">
                    <h1 className="ml-2 font-semibold text-lg">Loan Analytics</h1>
                    <div className="flex flex-row items-center gap-4">
                        <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                            <h2 className="font-bold text-2xl text-l-200">80%</h2>
                            <h3 className="text-sm text-l-200/90">Health</h3>
                        </div>
                        <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                            <h2 className="font-bold text-2xl text-l-200">0.015%</h2>
                            <h3 className="text-sm text-l-200/90">Daily Interest Rate</h3>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid-cols-subgrid col-span-3 flex flex-col gap-1">
                <h1 className="ml-4 font-semibold text-lg">Loan Operations</h1>
                <div className="h-full px-6 py-4 flex flex-col rounded-lg bg-d-100/70 border-2 border-d-100">
                    
                </div>
            </div>
            <div className="grid-cols-subgrid col-span-5 flex flex-col gap-1">
                <h1 className="ml-4 font-semibold text-lg">Escrow Wallet Operations</h1>
                <div className="h-full px-6 py-4 flex flex-col rounded-lg bg-d-100/70 border-2 border-d-100">

                </div>
            </div>
        </div>
    )
}
