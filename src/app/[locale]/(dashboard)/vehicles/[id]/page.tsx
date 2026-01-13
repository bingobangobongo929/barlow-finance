"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  Calendar,
  Wrench,
  MoreHorizontal,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Vehicle, VehicleMaintenance } from "@/lib/types";

export default function VehicleDetailPage() {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [maintenance, setMaintenance] = React.useState<VehicleMaintenance[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    React.useState<VehicleMaintenance | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [locale, setLocale] = React.useState<"en" | "da">("en");

  const [formData, setFormData] = React.useState({
    type: "service" as import("@/lib/types").MaintenanceType,
    description: "",
    service_date: new Date().toISOString().split("T")[0],
    cost: "",
    mileage_at_service: "",
    next_due_mileage: "",
    notes: "",
    });

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id, preferred_language")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/register");
        return;
      }

      setLocale((profile.preferred_language as "en" | "da") || "en");

      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", params.id)
        .eq("household_id", profile.household_id)
        .single();

      if (!vehicleData) {
        router.push("/vehicles");
        return;
      }

      setVehicle(vehicleData);

      const { data: maintenanceData } = await supabase
        .from("vehicle_maintenance")
        .select("*")
        .eq("vehicle_id", params.id)
        .order("service_date", { ascending: false });

      setMaintenance(maintenanceData || []);
      setIsLoading(false);
    }

    loadData();
  }, [supabase, router, params.id]);

  const resetForm = () => {
    setFormData({
      type: "service",
      description: "",
      service_date: new Date().toISOString().split("T")[0],
      cost: "",
      mileage_at_service: "",
      next_due_mileage: "",
      notes: "",
      });
  };

  const openEditModal = (m: VehicleMaintenance) => {
    setSelectedMaintenance(m);
    setFormData({
      type: m.type,
      description: m.description,
      service_date: m.service_date || "",
      cost: m.cost?.toString() || "",
      mileage_at_service: m.mileage_at_service?.toString() || "",
      next_due_mileage: m.next_due_mileage?.toString() || "",
      notes: m.notes || "",
      });
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    if (!vehicle) return;
    setIsSubmitting(true);

    try {
      const data = {
        vehicle_id: vehicle.id,
        type: formData.type,
        description: formData.description.trim(),
        service_date: formData.service_date || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        mileage_at_service: formData.mileage_at_service
          ? parseInt(formData.mileage_at_service, 10)
          : null,
        next_due_mileage: formData.next_due_mileage
          ? parseInt(formData.next_due_mileage, 10)
          : null,
        notes: formData.notes.trim() || null,
        };

      if (isEdit && selectedMaintenance) {
        const { error } = await supabase
          .from("vehicle_maintenance")
          .update(data)
          .eq("id", selectedMaintenance.id);

        if (error) throw error;
        showSuccess(t("maintenanceUpdated"));
      } else {
        const { error } = await supabase
          .from("vehicle_maintenance")
          .insert(data);

        if (error) throw error;
        showSuccess(t("maintenanceAdded"));
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();

      // Refresh data
      const { data: newData } = await supabase
        .from("vehicle_maintenance")
        .select("*")
        .eq("vehicle_id", params.id)
        .order("service_date", { ascending: false });

      setMaintenance(newData || []);
    } catch (error) {
      console.error("Maintenance error:", error);
      showError(t("maintenanceError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const markComplete = async (m: VehicleMaintenance) => {
    try {
      const { error } = await supabase
        .from("vehicle_maintenance")
        .update({
          })
        .eq("id", m.id);

      if (error) throw error;
      showSuccess(t("markedComplete"));

      setMaintenance((prev) =>
        prev.map((item) =>
          item.id === m.id
            ? {
                ...item,
                }
            : item
        )
      );
    } catch (error) {
      showError(t("updateError"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!vehicle) return null;

  const completedMaintenance = maintenance.filter((m) => m.service_date);
  const upcomingMaintenance = maintenance.filter((m) => m.next_due_date && new Date(m.next_due_date) > new Date());
  const totalCost = completedMaintenance.reduce(
    (sum, m) => sum + (m.cost || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vehicles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon("back")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🚗</span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
              {vehicle.nickname}
            </h1>
            <p className="text-[var(--text-secondary)]">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addMaintenance")}
        </Button>
      </div>

      {/* Vehicle Info */}
      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
          {t("vehicleInfo")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vehicle.license_plate && (
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("licensePlate")}
              </p>
              <p className="font-medium text-[var(--text-primary)]">
                {vehicle.license_plate}
              </p>
            </div>
          )}
          {vehicle.current_mileage && (
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("currentMileage")}
              </p>
              <p className="font-medium text-[var(--text-primary)]">
                {vehicle.current_mileage.toLocaleString()} km
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {t("totalMaintenanceCost")}
            </p>
            <p className="font-medium text-[var(--accent-warning)]">
              {formatCurrency(totalCost, "DKK", locale)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {t("maintenanceRecords")}
            </p>
            <p className="font-medium text-[var(--text-primary)]">
              {maintenance.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Upcoming Maintenance */}
      {upcomingMaintenance.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
            {t("upcomingMaintenance")}
          </h3>
          <div className="space-y-3">
            {upcomingMaintenance.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning)]/10">
                    <Wrench className="h-5 w-5 text-[var(--accent-warning)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {m.description}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {m.service_date && formatDate(m.service_date, locale)}
                      {m.cost && ` • ${formatCurrency(m.cost, "DKK", locale)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markComplete(m)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t("markComplete")}
                  </Button>
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                    align="end"
                  >
                    <DropdownItem onClick={() => openEditModal(m)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {tCommon("edit")}
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Maintenance History */}
      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text-primary)]">
          {t("maintenanceHistory")}
        </h3>
        {completedMaintenance.length === 0 ? (
          <p className="text-[var(--text-secondary)]">{t("noHistory")}</p>
        ) : (
          <div className="space-y-3">
            {completedMaintenance.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-success)]/10">
                    <Check className="h-5 w-5 text-[var(--accent-success)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {m.description}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {m.service_date && formatDate(m.service_date, locale)}
                      {m.mileage_at_service &&
                        ` • ${m.mileage_at_service.toLocaleString()} km`}
                      {m.cost && ` • ${formatCurrency(m.cost, "DKK", locale)}`}
                    </p>
                  </div>
                </div>
                <Badge variant="success">{t("completed")}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("addMaintenance")}
      >
        <MaintenanceForm
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(false)}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
        />
      </Modal>

      {/* Edit Maintenance Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMaintenance(null);
          resetForm();
        }}
        title={t("editMaintenance")}
      >
        <MaintenanceForm
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedMaintenance(null);
            resetForm();
          }}
          isEdit
        />
      </Modal>
    </div>
  );
}

interface MaintenanceFormProps {
  formData: {
    type: import('@/lib/types').MaintenanceType;
    description: string;
    service_date: string;
    cost: string;
    mileage_at_service: string;
    next_due_mileage: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<MaintenanceFormProps['formData']>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function MaintenanceForm({
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  onCancel,
  isEdit,
}: MaintenanceFormProps) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="type" required>
            {t("maintenanceType")}
          </Label>
          <Select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as typeof formData.type,
              })
            }
            required
          >
            <option value="service">{t("type.service")}</option>
            <option value="repair">{t("type.repair")}</option>
            <option value="inspection">{t("type.inspection")}</option>
            <option value="other">{t("type.other")}</option>
          </Select>
        </div>

        <div className="form-group">
          <Label htmlFor="service_date">{t("scheduledDate")}</Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e) =>
              setFormData({ ...formData, service_date: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="description" required>
          {t("description")}
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder={t("descriptionPlaceholder")}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="cost">{t("cost")}</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          />
        </div>

        <div className="form-group">
          <Label htmlFor="mileage_at_service">{t("mileageAtService")}</Label>
          <Input
            id="mileage_at_service"
            type="number"
            min="0"
            value={formData.mileage_at_service}
            onChange={(e) =>
              setFormData({ ...formData, mileage_at_service: e.target.value })
            }
          />
        </div>
      </div>

      

      <div className="form-group">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
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
