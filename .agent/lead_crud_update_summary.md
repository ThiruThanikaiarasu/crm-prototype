# Lead CRUD Update Summary

## Overview
Updated the Lead CRUD operations to support new fields added to the models:
- **CompanyLead Model**: Updated phone structure, added address object
- **ContactLead Model**: Updated phone structure, added department and remarks
- **Lead Model**: Added benificiary object with name and phone

---

## Changes Made

### 1. Validator (`validators/lead.validator.js`)

#### Company Phone Structure (Updated)
- ✅ `company.phone.countryCode` - max 5 chars, starts with +
- ✅ `company.phone.number` - 8-15 digits
- ✅ `company.phone.extension` - max 10 chars, digits only

#### Company Address (New)
- ✅ `company.address.door` - alphanumeric with /, -, space (max 20 chars)
- ✅ `company.address.street` - 3-100 chars with letters, numbers, comma, dot, hyphen
- ✅ `company.address.area` - 2-100 chars
- ✅ `company.address.city` - letters and spaces only (2-50 chars)
- ✅ `company.address.pincode` - 5-digit postal code
- ✅ `company.address.location.latitude` - float between -90 and 90
- ✅ `company.address.location.longitude` - float between -180 and 180
- ✅ `company.address.shortAddress` - 4 uppercase letters + 4 digits (e.g., RRRD2929)

#### Contact/Lead Phone Structure (Updated)
- ✅ `leads.*.phone.countryCode` - max 5 chars, starts with +
- ✅ `leads.*.phone.number` - 8-15 digits
- ✅ `leads.*.phone.extension` - max 10 chars, digits only

#### Contact Fields (New)
- ✅ `leads.*.department` - 2-50 characters
- ✅ `leads.*.remarks` - 2-255 characters

#### Lead Beneficiary (New)
- ✅ `leads.*.benificiary.name` - 2-50 characters
- ✅ `leads.*.benificiary.phone.countryCode` - max 5 chars, starts with +
- ✅ `leads.*.benificiary.phone.number` - 8-15 digits
- ✅ `leads.*.benificiary.phone.extension` - max 10 chars, digits only

---

### 2. Service (`services/lead.service.js`)

#### Create Lead Operation
1. **Contact Creation**: Excludes `benificiary` from contact data (line 110)
   ```javascript
   const { status, source, followUp, priority, droppedReason, benificiary, ...contactInfo } = leadData
   ```

2. **Lead Creation**: Includes `benificiary` in lead data (line 128)
   ```javascript
   benificiary: originalLead.benificiary || undefined
   ```

3. **Response Formatting**: Includes new fields in response (lines 147-150)
   ```javascript
   department: contactInfo.department,
   remarks: contactInfo.remarks,
   benificiary: lead.benificiary
   ```

#### Update Lead Operation
1. **Destructuring**: Added new fields to payload (line 262)
   ```javascript
   const { company, leads, name, email, phone, department, remarks, status, source, followUp, priority, droppedReason, benificiary } = payload
   ```

2. **Company Address Update**: Handles nested address object including location (lines 278-293)
   - Supports updating individual address fields
   - Supports updating location coordinates
   - Uses dot notation for MongoDB updates

3. **Contact Updates**: Includes department and remarks (lines 292-293)
   ```javascript
   if (department !== undefined) contactUpdateData.department = department
   if (remarks !== undefined) contactUpdateData.remarks = remarks
   ```

4. **Lead Beneficiary Update**: Handles nested beneficiary object (lines 390-411)
   - Supports updating beneficiary name
   - Supports updating beneficiary phone fields
   - Initializes objects if they don't exist

5. **Batch Lead Creation**: Includes beneficiary when adding new leads (line 376)

---

### 3. Repository (`repositories/lead.repository.js`)

#### Get Lead By ID
Updated `$addFields` stage to include new contact fields (lines 73-78):
```javascript
$addFields: {
    name: '$contact.name',
    email: '$contact.email',
    phone: '$contact.phone',
    department: '$contact.department',  // NEW
    remarks: '$contact.remarks'         // NEW
}
```

#### Get All Leads
Updated nested aggregation pipeline to include new contact fields (lines 211-217):
```javascript
$addFields: {
    name: '$contact.name',
    email: '$contact.email',
    phone: '$contact.phone',
    department: '$contact.department',  // NEW
    remarks: '$contact.remarks'         // NEW
}
```

**Note**: Beneficiary is automatically included in lead projection as it's a direct field on the Lead model.

---

## Testing Checklist

### Create Operations
- [ ] Create lead with company address
- [ ] Create lead with contact department and remarks
- [ ] Create lead with beneficiary information
- [ ] Create lead with all new phone fields (countryCode, number, extension)
- [ ] Verify validation errors for invalid address formats
- [ ] Verify validation errors for invalid phone formats

### Read Operations
- [ ] Fetch lead by ID - verify all new fields are returned
- [ ] Fetch all leads - verify new fields in both company and contact
- [ ] Verify address object structure in response
- [ ] Verify beneficiary object in response

### Update Operations
- [ ] Update company address partially
- [ ] Update company address location
- [ ] Update contact department and remarks
- [ ] Update lead beneficiary name
- [ ] Update lead beneficiary phone
- [ ] Update phone fields (countryCode, number, extension)
- [ ] Verify partial updates work correctly

### Delete Operations
- [ ] Soft delete should work as before (no changes needed)
- [ ] Restore should work as before (no changes needed)

---

## API Request Examples

### Create Lead with New Fields
```json
{
  "company": {
    "name": "Tech Solutions Inc",
    "phone": {
      "countryCode": "+966",
      "number": "123456789",
      "extension": "101"
    },
    "address": {
      "door": "Building 5",
      "street": "King Fahd Road",
      "area": "Al Olaya",
      "city": "Riyadh",
      "pincode": "12345",
      "location": {
        "latitude": 24.7136,
        "longitude": 46.6753
      },
      "shortAddress": "RIYD1234"
    },
    "email": "contact@techsolutions.com",
    "serviceType": "digital_solutions"
  },
  "leads": [
    {
      "name": "Ahmed Mohammed",
      "phone": {
        "countryCode": "+966",
        "number": "987654321",
        "extension": "202"
      },
      "email": "ahmed@techsolutions.com",
      "department": "IT Department",
      "remarks": "Interested in digital marketing services",
      "status": "new",
      "source": "Website",
      "priority": 5,
      "benificiary": {
        "name": "Sara Ahmed",
        "phone": {
          "countryCode": "+966",
          "number": "555123456"
        }
      }
    }
  ]
}
```

### Update Lead with New Fields
```json
{
  "company": {
    "address": {
      "street": "Updated Street Name",
      "location": {
        "latitude": 24.8000,
        "longitude": 46.7000
      }
    }
  },
  "department": "Marketing Department",
  "remarks": "Updated remarks - very interested",
  "benificiary": {
    "name": "Updated Beneficiary",
    "phone": {
      "countryCode": "+966",
      "number": "999888777"
    }
  }
}
```

---

## Files Modified

1. ✅ `validators/lead.validator.js` - Added validation for all new fields
2. ✅ `services/lead.service.js` - Updated create/update logic
3. ✅ `repositories/lead.repository.js` - Updated aggregation pipelines
4. ℹ️ `controllers/lead.controller.js` - No changes needed (handles all fields dynamically)
5. ℹ️ `models/*.model.js` - Already updated by user
6. ⚠️ `docs/swagger/leads.swagger.js` - **NEEDS UPDATE** (see below)

---

## ⚠️ Swagger Documentation Update Required

The Swagger documentation in `docs/swagger/leads.swagger.js` needs to be updated to reflect the new fields:

### Changes Needed:

1. **Phone Structure** - Update from `extension` to `countryCode` + add `extension` field:
   ```javascript
   // OLD (lines 33-38, 61-66, etc.)
   phone:
     extension: "+1"  // This was country code
     number: "5551234567"

   // NEW (should be)
   phone:
     countryCode: "+966"
     number: "5551234567"
     extension: "101"  // Optional internal extension
   ```

2. **Company Address** - Add address object with all sub-fields (door, street, area, city, pincode, location, shortAddress)

3. **Contact Fields** - Add department and remarks to lead contacts

4. **Beneficiary** - Add beneficiary object to leads array items

### Affected Sections:
- POST /leads (request body examples)
- GET /leads (response examples)
- GET /leads/{id} (response examples)
- PATCH /leads/{id} (request/response examples)
- Lead schema model definition (lines 654-709)

**Recommendation**: Update Swagger documentation in a separate task to maintain consistency with API.

---

## Notes

- All fields are optional to maintain backward compatibility
- Nested updates use MongoDB dot notation
- Validation messages match model validation patterns
- Phone structure now uses `countryCode` instead of the old `extension` for country codes
- Address validation follows Saudi Arabian postal code format (5 digits)
- Short address format: 4 uppercase letters + 4 digits (e.g., RRRD2929)
