"use client"

import { useState, useEffect } from 'react'
import { Plus, Play, Pause, Trash2, Edit, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { automationEngine, AutomationRule, AutomationCondition, AutomationAction } from '@/lib/automationEngine'
import { toast } from 'sonner'

export function AutomationRulesManager() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = () => {
    setRules(automationEngine.getRules())
  }

  const handleToggleRule = (ruleId: string) => {
    automationEngine.toggleRule(ruleId)
    loadRules()
    const rule = automationEngine.getRule(ruleId)
    toast.success(rule?.enabled ? 'Automation rule enabled' : 'Automation rule disabled')
  }

  const handleDeleteRule = (ruleId: string) => {
    automationEngine.deleteRule(ruleId)
    loadRules()
    toast.success('Automation rule deleted')
  }

  const handleCreateRule = () => {
    setEditingRule(null)
    setDialogOpen(true)
  }

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automation Rules
          </h2>
          <p className="text-muted-foreground mt-1">
            Automate repetitive tasks with custom rules
          </p>
        </div>
        <Button onClick={handleCreateRule} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">
            No automation rules yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first automation rule to streamline your workflow
          </p>
          <Button onClick={handleCreateRule} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      {rule.enabled ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                      </Badge>
                      {rule.triggerCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Triggered {rule.triggerCount} time{rule.triggerCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <strong>When:</strong>{' '}
                      {rule.conditions.map((c, i) => (
                        <span key={i}>
                          {i > 0 && ' AND '}
                          {c.field} {c.operator} {String(c.value)}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <strong>Then:</strong>{' '}
                      {rule.actions.map((a, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {a.type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditRule(rule)}
                    className="h-9 w-9"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="h-9 w-9 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RuleEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSave={() => {
          loadRules()
          setDialogOpen(false)
        }}
      />
    </div>
  )
}

interface RuleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: AutomationRule | null
  onSave: () => void
}

function RuleEditorDialog({ open, onOpenChange, rule, onSave }: RuleEditorDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [conditions, setConditions] = useState<AutomationCondition[]>([])
  const [actions, setActions] = useState<AutomationAction[]>([])

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setDescription(rule.description)
      setEnabled(rule.enabled)
      setConditions(rule.conditions)
      setActions(rule.actions)
    } else {
      setName('')
      setDescription('')
      setEnabled(true)
      setConditions([{ field: 'status', operator: 'equals', value: 'completed' }])
      setActions([{ type: 'archive', value: true }])
    }
  }, [rule, open])

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a rule name')
      return
    }

    if (conditions.length === 0) {
      toast.error('Please add at least one condition')
      return
    }

    if (actions.length === 0) {
      toast.error('Please add at least one action')
      return
    }

    if (rule) {
      automationEngine.updateRule(rule.id, {
        name,
        description,
        enabled,
        conditions,
        actions
      })
      toast.success('Automation rule updated')
    } else {
      automationEngine.addRule({
        name,
        description,
        type: 'auto_status_change',
        enabled,
        conditions,
        actions
      })
      toast.success('Automation rule created')
    }

    onSave()
  }

  const addCondition = () => {
    setConditions([...conditions, { field: 'status', operator: 'equals', value: '' }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    setConditions(conditions.map((c, i) => i === index ? { ...c, ...updates } : c))
  }

  const addAction = () => {
    setActions([...actions, { type: 'set_status', value: '' }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, updates: Partial<AutomationAction>) => {
    setActions(actions.map((a, i) => i === index ? { ...a, ...updates } : a))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </DialogTitle>
          <DialogDescription>
            Define conditions and actions for your automation rule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Auto-archive completed tasks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>Enable this rule</Label>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Conditions (ALL must be true)</Label>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </Button>
            </div>

            {conditions.map((condition, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="completedAt">Completed At</SelectItem>
                      <SelectItem value="updatedAt">Updated At</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value: any) => updateCondition(index, { operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="days_after">Days After</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Value"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Actions (ALL will be executed)</Label>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-3 w-3 mr-1" />
                Add Action
              </Button>
            </div>

            {actions.map((action, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={action.type}
                    onValueChange={(value: any) => updateAction(index, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="archive">Archive Task</SelectItem>
                      <SelectItem value="set_status">Set Status</SelectItem>
                      <SelectItem value="set_priority">Set Priority</SelectItem>
                      <SelectItem value="add_tag">Add Tag</SelectItem>
                      <SelectItem value="add_category">Add Category</SelectItem>
                      <SelectItem value="create_subtask">Create Subtask</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      value={action.value}
                      onChange={(e) => updateAction(index, { value: e.target.value })}
                      placeholder={action.type === 'archive' ? 'true/false' : 'Value'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
