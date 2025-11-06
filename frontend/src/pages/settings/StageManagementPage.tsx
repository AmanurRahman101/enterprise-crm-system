import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Alert,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dealStageService, DealStage, CreateStageData, UpdateStageData } from '../../services/dealStageService';

// Color options for stages
const COLOR_OPTIONS = [
  { value: 'primary', label: 'Blue', hex: '#1976d2' },
  { value: 'secondary', label: 'Purple', hex: '#9c27b0' },
  { value: 'success', label: 'Green', hex: '#2e7d32' },
  { value: 'warning', label: 'Orange', hex: '#ed6c02' },
  { value: 'error', label: 'Red', hex: '#d32f2f' },
  { value: 'info', label: 'Cyan', hex: '#0288d1' },
  { value: 'gray', label: 'Gray', hex: '#757575' },
];

// Sortable Stage Item Component
interface SortableStageItemProps {
  stage: DealStage;
  onEdit: (stage: DealStage) => void;
  onDelete: (stage: DealStage) => void;
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorOption = COLOR_OPTIONS.find(c => c.value === stage.color) || COLOR_OPTIONS[0];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{ mb: 2, cursor: 'grab' }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Drag Handle */}
          <IconButton {...attributes} {...listeners} size="small">
            <DragIcon />
          </IconButton>

          {/* Stage Color */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              backgroundColor: colorOption.hex,
            }}
          />

          {/* Stage Info */}
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">{stage.name}</Typography>
              {stage.isDefault && <Chip label="Default" color="primary" size="small" />}
              {stage.isWon && <Chip label="Won" color="success" size="small" />}
              {stage.isLost && <Chip label="Lost" color="error" size="small" />}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Order: {stage.order} 
              {stage.probability !== null && stage.probability !== undefined && ` • Probability: ${stage.probability}%`}
            </Typography>
          </Box>

          {/* Actions */}
          <IconButton onClick={() => onEdit(stage)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDelete(stage)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

// Stage Form Dialog Component
interface StageFormDialogProps {
  open: boolean;
  stage: DealStage | null;
  onClose: () => void;
  onSave: (data: CreateStageData | UpdateStageData) => void;
}

function StageFormDialog({ open, stage, onClose, onSave }: StageFormDialogProps) {
  const [formData, setFormData] = useState<CreateStageData>({
    name: '',
    color: 'primary',
    probability: undefined,
    isDefault: false,
    isWon: false,
    isLost: false,
  });

  useEffect(() => {
    if (stage) {
      setFormData({
        name: stage.name,
        color: stage.color,
        probability: stage.probability || undefined,
        isDefault: stage.isDefault,
        isWon: stage.isWon,
        isLost: stage.isLost,
      });
    } else {
      setFormData({
        name: '',
        color: 'primary',
        probability: undefined,
        isDefault: false,
        isWon: false,
        isLost: false,
      });
    }
  }, [stage, open]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{stage ? 'Edit Stage' : 'Create New Stage'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Stage Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <TextField
            select
            label="Color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            fullWidth
          >
            {COLOR_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: 0.5,
                      backgroundColor: option.hex,
                    }}
                  />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Probability (%)"
            type="number"
            value={formData.probability || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                probability: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            helperText="Optional: Set a default win probability for this stage"
          />

          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
              }
              label="Set as default stage for new deals"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isWon}
                  onChange={(e) => setFormData({ ...formData, isWon: e.target.checked })}
                />
              }
              label="Mark as 'Won' stage"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isLost}
                  onChange={(e) => setFormData({ ...formData, isLost: e.target.checked })}
                />
              }
              label="Mark as 'Lost' stage"
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name}>
          {stage ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Delete Confirmation Dialog
interface DeleteDialogProps {
  open: boolean;
  stage: DealStage | null;
  stages: DealStage[];
  onClose: () => void;
  onConfirm: (migrateToStageId?: string) => void;
}

function DeleteConfirmDialog({ open, stage, stages, onClose, onConfirm }: DeleteDialogProps) {
  const [migrateToStageId, setMigrateToStageId] = useState<string>('');

  const otherStages = stages.filter(s => s.id !== stage?.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Stage</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Are you sure you want to delete the stage "{stage?.name}"?
        </Alert>
        
        {otherStages.length > 0 && (
          <TextField
            select
            label="Migrate existing deals to"
            value={migrateToStageId}
            onChange={(e) => setMigrateToStageId(e.target.value)}
            fullWidth
            helperText="If this stage has deals, select where to move them"
          >
            <MenuItem value="">
              <em>None (will fail if stage has deals)</em>
            </MenuItem>
            {otherStages.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onConfirm(migrateToStageId || undefined)}
          variant="contained"
          color="error"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Component
export default function StageManagementPage() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<DealStage | null>(null);
  const [deletingStage, setDeletingStage] = useState<DealStage | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load stages
  const loadStages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dealStageService.getStages();
      setStages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const newStages = arrayMove(stages, oldIndex, newIndex);
      setStages(newStages);

      try {
        const stageIds = newStages.map((s) => s.id);
        await dealStageService.reorderStages(stageIds);
        setSuccess('Stages reordered successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to reorder stages');
        loadStages(); // Reload to reset order
      }
    }
  };

  // Handle create/edit
  const handleSaveStage = async (data: CreateStageData | UpdateStageData) => {
    try {
      setError(null);
      if (editingStage) {
        await dealStageService.updateStage(editingStage.id, data);
        setSuccess('Stage updated successfully');
      } else {
        await dealStageService.createStage(data as CreateStageData);
        setSuccess('Stage created successfully');
      }
      setFormDialogOpen(false);
      setEditingStage(null);
      loadStages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save stage');
    }
  };

  // Handle delete
  const handleDeleteStage = async (migrateToStageId?: string) => {
    if (!deletingStage) return;

    try {
      setError(null);
      await dealStageService.deleteStage(deletingStage.id, migrateToStageId);
      setSuccess('Stage deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingStage(null);
      loadStages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete stage');
    }
  };

  // Open edit dialog
  const handleEdit = (stage: DealStage) => {
    setEditingStage(stage);
    setFormDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (stage: DealStage) => {
    setDeletingStage(stage);
    setDeleteDialogOpen(true);
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingStage(null);
    setFormDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Deal Pipeline Stages</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Stage
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline Stages
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Drag and drop to reorder stages. The order determines how they appear in the Kanban board.
              </Typography>

              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={stages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stages.map((stage) => (
                      <SortableStageItem
                        key={stage.id}
                        stage={stage}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips
              </Typography>
              <Stack spacing={2}>
                <Typography variant="body2">
                  • <strong>Default Stage:</strong> New deals will be created in the default stage.
                </Typography>
                <Typography variant="body2">
                  • <strong>Won/Lost:</strong> Mark stages that represent closed deals.
                </Typography>
                <Typography variant="body2">
                  • <strong>Probability:</strong> Set expected win rates for each stage.
                </Typography>
                <Typography variant="body2">
                  • <strong>Drag & Drop:</strong> Reorder stages to customize your pipeline.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <StageFormDialog
        open={formDialogOpen}
        stage={editingStage}
        onClose={() => {
          setFormDialogOpen(false);
          setEditingStage(null);
        }}
        onSave={handleSaveStage}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        stage={deletingStage}
        stages={stages}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingStage(null);
        }}
        onConfirm={handleDeleteStage}
      />
    </Box>
  );
}
