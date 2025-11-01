"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Activity, Users, ClipboardList, Stethoscope, Clock, Plus } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getNurseNavigation } from "@/lib/navigation/nurse-navigation"

// Mock tasks data
const mockTasks = [
  {
    id: "T001",
    patientName: "Nguyễn Văn A",
    patientId: "BN001",
    task: "Đo huyết áp và nhiệt độ",
    time: "09:30",
    priority: "high",
    completed: false,
    category: "vital-signs",
  },
  {
    id: "T002",
    patientName: "Trần Thị B",
    patientId: "BN002",
    task: "Tiêm thuốc kháng sinh",
    time: "10:00",
    priority: "high",
    completed: false,
    category: "medication",
  },
  {
    id: "T003",
    patientName: "Lê Văn C",
    patientId: "BN003",
    task: "Thay băng vết thương",
    time: "10:30",
    priority: "medium",
    completed: false,
    category: "wound-care",
  },
  {
    id: "T004",
    patientName: "Phạm Thị D",
    patientId: "BN004",
    task: "Hỗ trợ vệ sinh cá nhân",
    time: "11:00",
    priority: "low",
    completed: false,
    category: "care",
  },
  {
    id: "T005",
    patientName: "Hoàng Văn E",
    patientId: "BN005",
    task: "Kiểm tra đường huyết",
    time: "14:00",
    priority: "high",
    completed: false,
    category: "vital-signs",
  },
  {
    id: "T006",
    patientName: "Nguyễn Thị F",
    patientId: "BN006",
    task: "Cho uống thuốc",
    time: "14:30",
    priority: "medium",
    completed: true,
    category: "medication",
  },
]

export default function NurseTasksPage() {
  // Get nurse navigation from centralized config
  const navigation = getNurseNavigation()

  const router = useRouter()
  const [tasks, setTasks] = useState(mockTasks)

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const pendingTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "vital-signs":
        return "Sinh hiệu"
      case "medication":
        return "Thuốc"
      case "wound-care":
        return "Chăm sóc vết thương"
      case "care":
        return "Chăm sóc"
      default:
        return category
    }
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nhiệm vụ chăm sóc</h1>
            <p className="text-muted-foreground">Quản lý công việc hàng ngày</p>
          </div>
          <Button onClick={() => router.push("/nurse/tasks/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhiệm vụ
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
              <ClipboardList className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ưu tiên cao</CardTitle>
              <Activity className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.filter((t) => t.priority === "high").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
              <Activity className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Nhiệm vụ chờ xử lý</CardTitle>
            <CardDescription>Danh sách công việc cần hoàn thành</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Không có nhiệm vụ nào</p>
              ) : (
                pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                    <Checkbox
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{task.time}</span>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority === "high" ? "Khẩn" : task.priority === "medium" ? "Trung bình" : "Thấp"}
                            </Badge>
                            <Badge variant="outline">{getCategoryLabel(task.category)}</Badge>
                          </div>
                          <p className="text-sm font-medium">{task.task}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{task.patientName}</span>
                            <Badge variant="outline">{task.patientId}</Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/nurse/tasks/${task.id}`)}>
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Đã hoàn thành</CardTitle>
              <CardDescription>Các nhiệm vụ đã xử lý</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-4 border-b pb-4 last:border-0 opacity-60">
                    <Checkbox id={task.id} checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium line-through">{task.time}</span>
                        <Badge variant="outline">{getCategoryLabel(task.category)}</Badge>
                      </div>
                      <p className="text-sm font-medium line-through">{task.task}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{task.patientName}</span>
                        <Badge variant="outline">{task.patientId}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
