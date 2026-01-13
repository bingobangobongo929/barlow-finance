"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Target,
  Calendar,
  TrendingUp,
  GripVertical,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface ProjectsContentProps {
  projects: Project[];
  locale: "en" | "da";
  householdId: string;
}

export function ProjectsContent({
  projects,
  locale,
  householdId,
}: ProjectsContentProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showContributeModal, setShowContributeModal] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filter, setFilter] = React.useState<
    "all" | "active" | "completed" | "paused"
  >("active");

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
    status: "active" as "active" | "completed" | "paused" | "cancelled",
    priority: "1",
    color: "#C67C4E",
    icon: "🎯",
  });

  const [contributeAmount, setContributeAmount] = React.useState("");

  const iconOptions = ["🎯", "🏠", "🚗", "✈️", "💍", "🎓", "💻", "📱", "🎁", "🌴"];
  const colorOptions = [
    "#C67C4E",
    "#8B9A7D",
    "#D4A574",
    "#A68B5B",
    "#9B8B7A",
    "#7D8471",
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      target_amount: "",
      current_amount: "0",
      target_date: "",
      status: "active",
      priority: "1",
      color: "#C67C4E",
      icon: "🎯",
    });
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      target_amount: project.target_amount.toString(),
      current_amount: project.current_amount.toString(),
      target_date: project.target_date || "",
      status: project.status,
      priority: project.priority.toString(),
      color: project.color || "#C67C4E",
      icon: project.icon || "🎯",
    });
    setShowEditModal(true);
  };

  const openContributeModal = (project: Project) => {
    setSelectedProject(project);
    setContributeAmount("");
    setShowContributeModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);

    try {
      const targetAmount = parseFloat(formData.target_amount);
      const currentAmount = parseFloat(formData.current_amount);

      if (isNaN(targetAmount) || targetAmount <= 0) {
        showError(t("invalidTarget"));
        return;
      }

      const projectData = {
        household_id: householdId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        target_amount: targetAmount,
        current_amount: currentAmount || 0,
        target_date: formData.target_date || null,
        status: currentAmount >= targetAmount ? "completed" : formData.status,
        priority: parseInt(formData.priority, 10),
        color: formData.color,
        icon: formData.icon,
      };

      if (isEdit && selectedProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", selectedProject.id);

        if (error) throw error;
        showSuccess(t("projectUpdated"));
      } else {
        const { error } = await supabase.from("projects").insert(projectData);

        if (error) throw error;
        showSuccess(t("projectAdded"));
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Project error:", error);
      showError(isEdit ? t("updateError") : t("addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);

    try {
      const amount = parseFloat(contributeAmount);
      if (isNaN(amount) || amount <= 0) {
        showError(t("invalidAmount"));
        return;
      }

      const newAmount = selectedProject.current_amount + amount;
      const newStatus =
        newAmount >= selectedProject.target_amount ? "completed" : "active";

      const { error } = await supabase
        .from("projects")
        .update({
          current_amount: newAmount,
          status: newStatus,
        })
        .eq("id", selectedProject.id);

      if (error) throw error;

      showSuccess(t("contributionAdded"));
      setShowContributeModal(false);
      setSelectedProject(null);
      setContributeAmount("");
      router.refresh();
    } catch (error) {
      console.error("Contribute error:", error);
      showError(t("contributeError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", selectedProject.id);

      if (error) throw error;

      showSuccess(t("projectDeleted"));
      setShowDeleteModal(false);
      setSelectedProject(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      showError(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "active") return p.status === "active";
    if (filter === "completed") return p.status === "completed";
    if (filter === "paused") return p.status === "paused";
    return true;
  });

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === "active");
  const totalTarget = activeProjects.reduce((sum, p) => sum + p.target_amount, 0);
  const totalSaved = activeProjects.reduce((sum, p) => sum + p.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">{t("completed")}</Badge>;
      case "paused":
        return <Badge variant="warning">{t("paused")}</Badge>;
      default:
        return <Badge variant="default">{t("active")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addProject")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
              <Target className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("activeGoals")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {activeProjects.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-success)]/10">
              <TrendingUp className="h-5 w-5 text-[var(--accent-success)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("totalSaved")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-success)]">
                {formatCurrency(totalSaved, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">
                {t("overallProgress")}
              </p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {overallProgress.toFixed(0)}%
              </p>
            </div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {formatCurrency(totalSaved, "DKK", locale)} /{" "}
              {formatCurrency(totalTarget, "DKK", locale)}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          {tCommon("all")} ({projects.length})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("active")}
        >
          {t("active")} ({projects.filter((p) => p.status === "active").length})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          {t("completed")} (
          {projects.filter((p) => p.status === "completed").length})
        </Button>
        <Button
          variant={filter === "paused" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("paused")}
        >
          {t("paused")} ({projects.filter((p) => p.status === "paused").length})
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <p className="text-[var(--text-secondary)]">{t("noProjects")}</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addProject")}
            </Button>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const percentage =
              project.target_amount > 0
                ? (project.current_amount / project.target_amount) * 100
                : 0;
            const remaining = project.target_amount - project.current_amount;

            return (
              <Card key={project.id} className="overflow-hidden">
                <div
                  className="h-2"
                  style={{ backgroundColor: project.color || "#C67C4E" }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{project.icon || "🎯"}</span>
                      <div>
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {project.name}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                    </div>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                      align="end"
                    >
                      <DropdownItem onClick={() => openContributeModal(project)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("contribute")}
                      </DropdownItem>
                      <DropdownItem onClick={() => openEditModal(project)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {tCommon("edit")}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          setSelectedProject(project);
                          setShowDeleteModal(true);
                        }}
                        className="text-[var(--accent-danger)]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tCommon("delete")}
                      </DropdownItem>
                    </Dropdown>
                  </div>

                  {project.description && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">
                        {formatCurrency(project.current_amount, "DKK", locale)}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {formatCurrency(project.target_amount, "DKK", locale)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="mt-2"
                      style={
                        {
                          "--progress-color":
                            project.status === "completed"
                              ? "var(--accent-success)"
                              : project.color || "var(--accent-primary)",
                        } as React.CSSProperties
                      }
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span>{percentage.toFixed(0)}% {t("complete")}</span>
                      {remaining > 0 && (
                        <span>
                          {formatCurrency(remaining, "DKK", locale)} {t("toGo")}
                        </span>
                      )}
                    </div>
                  </div>

                  {project.target_date && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <Calendar className="h-3 w-3" />
                      {t("targetDate")}: {formatDate(project.target_date, locale)}
                    </div>
                  )}

                  {project.status === "active" && (
                    <Button
                      className="mt-4 w-full"
                      size="sm"
                      onClick={() => openContributeModal(project)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("contribute")}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("addProject")}
      >
        <ProjectForm
          formData={formData}
          setFormData={setFormData}
          iconOptions={iconOptions}
          colorOptions={colorOptions}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(false)}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
          resetForm();
        }}
        title={t("editProject")}
      >
        <ProjectForm
          formData={formData}
          setFormData={setFormData}
          iconOptions={iconOptions}
          colorOptions={colorOptions}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedProject(null);
            resetForm();
          }}
          isEdit
        />
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={showContributeModal}
        onClose={() => {
          setShowContributeModal(false);
          setSelectedProject(null);
          setContributeAmount("");
        }}
        title={t("contribute")}
      >
        <div className="space-y-4">
          {selectedProject && (
            <Card className="bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedProject.icon || "🎯"}</span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedProject.name}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatCurrency(selectedProject.current_amount, "DKK", locale)}{" "}
                    / {formatCurrency(selectedProject.target_amount, "DKK", locale)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="form-group">
            <Label htmlFor="contributeAmount" required>
              {t("amount")}
            </Label>
            <Input
              id="contributeAmount"
              type="number"
              step="0.01"
              min="0"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowContributeModal(false);
                setSelectedProject(null);
                setContributeAmount("");
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button loading={isSubmitting} onClick={handleContribute}>
              {t("contribute")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        title={t("deleteProject")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("deleteConfirmation")}
          </p>
          {selectedProject && (
            <Card className="bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedProject.icon || "🎯"}</span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedProject.name}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatCurrency(selectedProject.current_amount, "DKK", locale)}{" "}
                    {t("saved")}
                  </p>
                </div>
              </div>
            </Card>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProject(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              loading={isSubmitting}
              onClick={handleDelete}
            >
              {tCommon("delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface ProjectFormProps {
  formData: {
    name: string;
    description: string;
    target_amount: string;
    current_amount: string;
    target_date: string;
    status: "active" | "completed" | "paused" | "cancelled";
    priority: string;
    color: string;
    icon: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormProps["formData"]>>;
  iconOptions: string[];
  colorOptions: string[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function ProjectForm({
  formData,
  setFormData,
  iconOptions,
  colorOptions,
  isSubmitting,
  onSubmit,
  onCancel,
  isEdit,
}: ProjectFormProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="form-group">
        <Label htmlFor="name" required>
          {t("projectName")}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t("projectNamePlaceholder")}
          required
        />
      </div>

      <div className="form-group">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder={t("descriptionPlaceholder")}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="target_amount" required>
            {t("targetAmount")}
          </Label>
          <Input
            id="target_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.target_amount}
            onChange={(e) =>
              setFormData({ ...formData, target_amount: e.target.value })
            }
            required
          />
        </div>

        {isEdit && (
          <div className="form-group">
            <Label htmlFor="current_amount">{t("currentAmount")}</Label>
            <Input
              id="current_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.current_amount}
              onChange={(e) =>
                setFormData({ ...formData, current_amount: e.target.value })
              }
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="target_date">{t("targetDate")}</Label>
          <Input
            id="target_date"
            type="date"
            value={formData.target_date}
            onChange={(e) =>
              setFormData({ ...formData, target_date: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <Label htmlFor="priority">{t("priorityLabel")}</Label>
          <Select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value })
            }
          >
            <option value="1">{t("priority.high")}</option>
            <option value="2">{t("priority.medium")}</option>
            <option value="3">{t("priority.low")}</option>
          </Select>
        </div>
      </div>

      {isEdit && (
        <div className="form-group">
          <Label htmlFor="status">{t("statusLabel")}</Label>
          <Select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as typeof formData.status,
              })
            }
          >
            <option value="active">{t("active")}</option>
            <option value="paused">{t("paused")}</option>
            <option value="completed">{t("completed")}</option>
          </Select>
        </div>
      )}

      <div className="form-group">
        <Label>{t("icon")}</Label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData({ ...formData, icon })}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors ${
                formData.icon === icon
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                  : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]"
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <Label>{t("color")}</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`h-8 w-8 rounded-full transition-transform ${
                formData.color === color
                  ? "ring-2 ring-[var(--accent-primary)] ring-offset-2"
                  : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
