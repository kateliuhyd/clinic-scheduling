package com.clinicconnect.dto;

import jakarta.validation.constraints.NotNull;

public class BookingRequest {
    @NotNull(message = "Slot ID is required")
    private Long slotId;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    private String notes;

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
