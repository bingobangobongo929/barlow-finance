"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  Car,
  Wrench,
  Calendar,
  Fuel,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useErrorToast, useSuccessToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Vehicle, VehicleMaintenance } from "@/lib/types";

interface VehicleWithMaintenance extends Vehicle {
  maintenance: VehicleMaintenance[];
  totalMaintenanceCost: number;
  upcomingCount: number;
}

interface VehiclesContentProps {
  vehicles: VehicleWithMaintenance[];
  locale: "en" | "da";
  householdId: string;
}

export function VehiclesContent({
  vehicles,
  locale,
  householdId,
}: VehiclesContentProps) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const showSuccess = useSuccessToast();
  const supabase = createClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    React.useState<VehicleWithMaintenance | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    nickname: "",
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    license_plate: "",
    vin: "",
    fuel_type: "petrol" as import("@/lib/types").FuelType,
    current_mileage: "",
    purchase_date: "",
    purchase_price: "",
    insurance_renewal_date: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      nickname: "",
      make: "",
      model: "",
      year: new Date().getFullYear().toString(),
      license_plate: "",
      vin: "",
      fuel_type: "petrol",
      current_mileage: "",
      purchase_date: "",
      purchase_price: "",
      insurance_renewal_date: "",
      notes: "",
    });
  };

  const openEditModal = (vehicle: VehicleWithMaintenance) => {
    setSelectedVehicle(vehicle);
    setFormData({
      nickname: vehicle.nickname,
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year?.toString() || "",
      license_plate: vehicle.license_plate || "",
      vin: vehicle.vin || "",
      fuel_type: vehicle.fuel_type || "petrol",
      current_mileage: vehicle.current_mileage?.toString() || "",
      purchase_date: vehicle.purchase_date || "",
      purchase_price: vehicle.purchase_price?.toString() || "",
      insurance_renewal_date: vehicle.insurance_renewal_date || "",
      notes: vehicle.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    setIsSubmitting(true);

    try {
      const vehicleData = {
        household_id: householdId,
        nickname: formData.nickname.trim(),
        make: formData.make.trim() || null,
        model: formData.model.trim() || null,
        year: formData.year ? parseInt(formData.year, 10) : null,
        license_plate: formData.license_plate.trim() || null,
        vin: formData.vin.trim() || null,
        fuel_type: formData.fuel_type,
        current_mileage: formData.current_mileage
          ? parseInt(formData.current_mileage, 10)
          : null,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price
          ? parseFloat(formData.purchase_price)
          : null,
        insurance_renewal_date: formData.insurance_renewal_date || null,
        notes: formData.notes.trim() || null,
      };

      if (isEdit && selectedVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", selectedVehicle.id);

        if (error) throw error;
        showSuccess(t("vehicleUpdated"));
      } else {
        const { error } = await supabase.from("vehicles").insert(vehicleData);

        if (error) throw error;
        showSuccess(t("vehicleAdded"));
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Vehicle error:", error);
      showError(isEdit ? t("updateError") : t("addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    setIsSubmitting(true);

    try {
      // Delete maintenance records first
      await supabase
        .from("vehicle_maintenance")
        .delete()
        .eq("vehicle_id", selectedVehicle.id);

      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", selectedVehicle.id);

      if (error) throw error;

      showSuccess(t("vehicleDeleted"));
      setShowDeleteModal(false);
      setSelectedVehicle(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      showError(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFuelIcon = (fuelType: string) => {
    switch (fuelType) {
      case "electric":
        return "⚡";
      case "hybrid":
        return "🔋";
      case "diesel":
        return "⛽";
      default:
        return "⛽";
    }
  };

  // Calculate totals
  const totalVehicles = vehicles.length;
  const totalMaintenanceCost = vehicles.reduce(
    (sum, v) => sum + v.totalMaintenanceCost,
    0
  );
  const totalUpcoming = vehicles.reduce((sum, v) => sum + v.upcomingCount, 0);

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
          {t("addVehicle")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
              <Car className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("totalVehicles")}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {totalVehicles}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning)]/10">
              <Wrench className="h-5 w-5 text-[var(--accent-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("maintenanceCost")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-warning)]">
                {formatCurrency(totalMaintenanceCost, "DKK", locale)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-danger)]/10">
              <Calendar className="h-5 w-5 text-[var(--accent-danger)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("upcomingMaintenance")}
              </p>
              <p className="text-xl font-bold text-[var(--accent-danger)]">
                {totalUpcoming}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vehicles Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="mt-4 text-[var(--text-secondary)]">{t("noVehicles")}</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addVehicle")}
            </Button>
          </Card>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🚗</span>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {vehicle.nickname}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </p>
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
                    <DropdownItem>
                      <Link
                        href={`/vehicles/${vehicle.id}`}
                        className="flex items-center"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t("viewDetails")}
                      </Link>
                    </DropdownItem>
                    <DropdownItem onClick={() => openEditModal(vehicle)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {tCommon("edit")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowDeleteModal(true);
                      }}
                      className="text-[var(--accent-danger)]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tCommon("delete")}
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {vehicle.license_plate && (
                    <div>
                      <p className="text-[var(--text-tertiary)]">
                        {t("licensePlate")}
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {vehicle.license_plate}
                      </p>
                    </div>
                  )}
                  {vehicle.current_mileage && (
                    <div>
                      <p className="text-[var(--text-tertiary)]">
                        {t("mileage")}
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {vehicle.current_mileage.toLocaleString()} km
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[var(--text-tertiary)]">{t("fuelType")}</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {getFuelIcon(vehicle.fuel_type || "petrol")}{" "}
                      {t(`fuel.${vehicle.fuel_type || "petrol"}`)}
                    </p>
                  </div>
                </div>

                {vehicle.upcomingCount > 0 && (
                  <div className="mt-3">
                    <Badge variant="warning">
                      <Wrench className="mr-1 h-3 w-3" />
                      {vehicle.upcomingCount} {t("upcomingServices")}
                    </Badge>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">
                      {t("viewDetails")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("addVehicle")}
        size="lg"
      >
        <VehicleForm
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

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVehicle(null);
          resetForm();
        }}
        title={t("editVehicle")}
        size="lg"
      >
        <VehicleForm
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedVehicle(null);
            resetForm();
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVehicle(null);
        }}
        title={t("deleteVehicle")}
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t("deleteConfirmation")}
          </p>
          {selectedVehicle && (
            <Card className="bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚗</span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedVehicle.nickname}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {selectedVehicle.make} {selectedVehicle.model}
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
                setSelectedVehicle(null);
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

interface VehicleFormProps {
  formData: {
    nickname: string;
    make: string;
    model: string;
    year: string;
    license_plate: string;
    vin: string;
    fuel_type: import("@/lib/types").FuelType;
    current_mileage: string;
    purchase_date: string;
    purchase_price: string;
    insurance_renewal_date: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<VehicleFormProps["formData"]>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function VehicleForm({
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
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
      <div className="form-group">
        <Label htmlFor="name" required>
          {t("vehicleName")}
        </Label>
        <Input
          id="name"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          placeholder={t("vehicleNamePlaceholder")}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="form-group">
          <Label htmlFor="make">{t("make")}</Label>
          <Input
            id="make"
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            placeholder="Toyota"
          />
        </div>

        <div className="form-group">
          <Label htmlFor="model">{t("model")}</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Corolla"
          />
        </div>

        <div className="form-group">
          <Label htmlFor="year">{t("year")}</Label>
          <Input
            id="year"
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="license_plate">{t("licensePlate")}</Label>
          <Input
            id="license_plate"
            value={formData.license_plate}
            onChange={(e) =>
              setFormData({ ...formData, license_plate: e.target.value })
            }
            placeholder="AB 12 345"
          />
        </div>

        <div className="form-group">
          <Label htmlFor="vin">{t("vin")}</Label>
          <Input
            id="vin"
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="fuel_type">{t("fuelType")}</Label>
          <Select
            id="fuel_type"
            value={formData.fuel_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                fuel_type: e.target.value as typeof formData.fuel_type,
              })
            }
          >
            <option value="petrol">{t("fuel.petrol")}</option>
            <option value="diesel">{t("fuel.diesel")}</option>
            <option value="electric">{t("fuel.electric")}</option>
            <option value="hybrid">{t("fuel.hybrid")}</option>
          </Select>
        </div>

        <div className="form-group">
          <Label htmlFor="current_mileage">{t("currentMileage")}</Label>
          <Input
            id="current_mileage"
            type="number"
            min="0"
            value={formData.current_mileage}
            onChange={(e) =>
              setFormData({ ...formData, current_mileage: e.target.value })
            }
            placeholder="50000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <Label htmlFor="purchase_date">{t("purchaseDate")}</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) =>
              setFormData({ ...formData, purchase_date: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <Label htmlFor="purchase_price">{t("purchasePrice")}</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.purchase_price}
            onChange={(e) =>
              setFormData({ ...formData, purchase_price: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="insurance_renewal_date">
          {t("insuranceRenewalDate")}
        </Label>
        <Input
          id="insurance_renewal_date"
          type="date"
          value={formData.insurance_renewal_date}
          onChange={(e) =>
            setFormData({ ...formData, insurance_renewal_date: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
