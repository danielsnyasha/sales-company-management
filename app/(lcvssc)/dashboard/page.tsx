import DashboardHeader from "../../../components/DashboardHeader"
import CgiTable from "@/components/CgiTable"
import BelowDataTable from "@/components/BelowDataTable"
import TargetsChart from "@/components/TargetsChart"
import GoalsTable from "@/components/GoalsTable"
import GraphSlideshow from "@/components/GraphSlideshow"

function DashboardPage() {
  return (
    <main className="min-h-screen max-h-screen bg-gray-100">
     
      <DashboardHeader />
      <section className="p-4 space-y-4">
       
        <CgiTable />
     
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GraphSlideshow />
          <TargetsChart />
        </div>

        <GoalsTable />
      </section>
    </main>
  )
}
export default DashboardPage