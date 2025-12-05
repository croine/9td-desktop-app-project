import { Task, Tag, Category } from '@/types/task'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Calendar, User, CheckCircle2, Flag, Folder, Tag as TagIcon } from 'lucide-react'
import { format } from 'date-fns'

interface PrintViewProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  title?: string
  showFilters?: boolean
  filters?: {
    status?: string
    priority?: string
    tags?: string[]
    categories?: string[]
  }
}

export function PrintView({ tasks, tags, categories, title = "Task List", showFilters = false, filters }: PrintViewProps) {
  const now = new Date()
  
  // Group tasks by status for organized printing
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress')
  const reviewTasks = tasks.filter(t => t.status === 'review')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const TaskRow = ({ task }: { task: Task }) => {
    const taskTags = tags.filter(tag => (task.tags || []).includes(tag.id))
    const taskCategories = categories.filter(cat => (task.categories || []).includes(cat.id))
    const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    
    return (
      <div className="py-3 px-4 border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {task.status === 'completed' && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
              
              <h3 className={`font-semibold text-base ${
                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              
              <Badge variant="outline" className={`text-xs ${
                task.priority === 'urgent' ? 'border-red-500 text-red-700 bg-red-50' :
                task.priority === 'high' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                task.priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                'border-blue-500 text-blue-700 bg-blue-50'
              }`}>
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-600 ml-8 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 ml-8 text-xs text-gray-500">
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                  {isOverdue && <span className="ml-1">(Overdue)</span>}
                </div>
              )}
              
              {taskCategories.length > 0 && (
                <div className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  <span>{taskCategories.map(c => c.name).join(', ')}</span>
                </div>
              )}
              
              {taskTags.length > 0 && (
                <div className="flex items-center gap-1">
                  <TagIcon className="h-3 w-3" />
                  <span>{taskTags.map(t => t.name).join(', ')}</span>
                </div>
              )}
              
              {(task.subtasks || []).length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    Subtasks: {(task.subtasks || []).filter(st => st.completed).length}/{task.subtasks?.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const TaskSection = ({ title, tasks, count }: { title: string; tasks: Task[]; count: number }) => {
    if (count === 0) return null
    
    return (
      <div className="mb-8 break-inside-avoid">
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-800">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <Badge variant="secondary" className="text-sm">
            {count} {count === 1 ? 'task' : 'tasks'}
          </Badge>
        </div>
        <div className="space-y-0">
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="print-view bg-white text-gray-900 min-h-screen p-8">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print-view {
            padding: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .break-after {
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 pb-6 border-b-4 border-gray-900 break-inside-avoid">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-sm text-gray-600">
              Generated on {format(now, 'MMMM dd, yyyy HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {showFilters && filters && (
        <Card className="mb-8 p-4 bg-gray-50 border-2 border-gray-200 break-inside-avoid no-print">
          <h3 className="font-semibold text-sm mb-2 text-gray-900">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <Badge variant="outline">Status: {filters.status}</Badge>
            )}
            {filters.priority && (
              <Badge variant="outline">Priority: {filters.priority}</Badge>
            )}
            {filters.tags && filters.tags.length > 0 && (
              <Badge variant="outline">
                Tags: {filters.tags.map(id => tags.find(t => t.id === id)?.name).join(', ')}
              </Badge>
            )}
            {filters.categories && filters.categories.length > 0 && (
              <Badge variant="outline">
                Categories: {filters.categories.map(id => categories.find(c => c.id === id)?.name).join(', ')}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-8 break-inside-avoid">
        <Card className="p-4 text-center bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{todoTasks.length}</div>
          <div className="text-xs text-blue-700 mt-1">To Do</div>
        </Card>
        <Card className="p-4 text-center bg-amber-50 border-amber-200">
          <div className="text-2xl font-bold text-amber-900">{inProgressTasks.length}</div>
          <div className="text-xs text-amber-700 mt-1">In Progress</div>
        </Card>
        <Card className="p-4 text-center bg-purple-50 border-purple-200">
          <div className="text-2xl font-bold text-purple-900">{reviewTasks.length}</div>
          <div className="text-xs text-purple-700 mt-1">Review</div>
        </Card>
        <Card className="p-4 text-center bg-green-50 border-green-200">
          <div className="text-2xl font-bold text-green-900">{completedTasks.length}</div>
          <div className="text-xs text-green-700 mt-1">Completed</div>
        </Card>
      </div>

      {/* Task Lists by Status */}
      <TaskSection title="📋 To Do" tasks={todoTasks} count={todoTasks.length} />
      <TaskSection title="🚀 In Progress" tasks={inProgressTasks} count={inProgressTasks.length} />
      <TaskSection title="👀 Review" tasks={reviewTasks} count={reviewTasks.length} />
      <TaskSection title="✅ Completed" tasks={completedTasks} count={completedTasks.length} />

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks to display</h3>
          <p className="text-gray-600">There are no tasks matching your current filters.</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-xs text-gray-500 break-inside-avoid">
        <p>9TD Task Management System</p>
        <p>Professional Task Dashboard - {format(now, 'yyyy')}</p>
      </div>
    </div>
  )
}
