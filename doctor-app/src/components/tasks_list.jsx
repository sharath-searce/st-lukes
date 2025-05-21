import React, { useState, useEffect } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Divider,
} from "@mui/material";
import {
  HealingOutlined,
  ScienceOutlined,
  AssignmentOutlined,
  EventNoteOutlined,
  NoteOutlined,
} from "@mui/icons-material";

// Reusable Table Component for Medicines
const MedicinesTable = ({ medicines, selected, onSelect }) => {
  if (!medicines || medicines.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No medicines prescribed.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ fontSize: "12px" }}>
      <Table sx={{ minWidth: 650 }} aria-label="medicines table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell sx={{ fontSize: "12px" }}>Name</TableCell>
            <TableCell sx={{ fontSize: "12px" }}>Dosage</TableCell>
            <TableCell sx={{ fontSize: "12px" }}>Frequency</TableCell>
            <TableCell sx={{ fontSize: "12px" }}>Duration</TableCell>
            <TableCell sx={{ fontSize: "12px" }}>Route</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {medicines.map((medicine, index) => (
            <TableRow
              key={`medicine-${index}`}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell padding="checkbox">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected[index] || false}
                      onChange={(event) =>
                        onSelect(index, event.target.checked)
                      }
                      size="small"
                    />
                  }
                  label=""
                />
              </TableCell>
              <TableCell component="th" scope="row" sx={{ fontSize: "12px" }}>
                {medicine.name}
              </TableCell>
              <TableCell sx={{ fontSize: "12px" }}>{medicine.dosage}</TableCell>
              <TableCell sx={{ fontSize: "12px" }}>
                {medicine.frequency}
              </TableCell>
              <TableCell sx={{ fontSize: "12px" }}>
                {medicine.duration}
              </TableCell>
              <TableCell sx={{ fontSize: "12px" }}>{medicine.route}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Reusable List Item Component
const DataListItem = ({ item, index, sectionKey, selected, onSelect }) => {
  let primaryText = "";
  let secondaryText = "";

  if (sectionKey === "lab_tests") {
    primaryText = item.test_name;
    secondaryText = `Code: ${item.test_code}`;
  } else if (sectionKey === "follow_ups") {
    primaryText = item.schedule;
    secondaryText = item.reason;
  } else {
    primaryText = item;
  }

  return (
    <ListItem
      key={`${sectionKey}-${index}`}
      sx={{ fontSize: "12px", padding: "8px 0" }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={selected[index] || false}
            onChange={(event) => onSelect(index, event.target.checked)}
            size="small"
          />
        }
        label={
          <ListItemText
            primaryTypographyProps={{ fontSize: "12px" }}
            secondaryTypographyProps={{ fontSize: "10px" }}
            primary={primaryText}
            secondary={secondaryText}
          />
        }
      />
    </ListItem>
  );
};

// Wrapper Component
const MedicalDataRenderer = ({ data }) => {
  const [medicalData, setMedicalData] = useState({
    medicines: [],
    lab_tests: [],
    instructions: [],
    follow_ups: [],
    notes: [],
    unparsed: [],
  });

  const [selectedItems, setSelectedItems] = useState({
    medicines: {},
    lab_tests: {},
    instructions: {},
    follow_ups: {},
    notes: {},
    unparsed: {},
  });

  useEffect(() => {
    if (data) {
      setMedicalData({
        medicines: data.medicines || [],
        lab_tests: data.lab_tests || [],
        instructions: data.instructions || [],
        follow_ups: data.follow_ups || [],
        notes: data.notes || [],
        unparsed: data.unparsed || [],
      });
      setSelectedItems({
        medicines: {},
        lab_tests: {},
        instructions: {},
        follow_ups: {},
        notes: {},
        unparsed: {},
      });
    } else {
      setMedicalData({
        medicines: [],
        lab_tests: [],
        instructions: [],
        follow_ups: [],
        notes: [],
        unparsed: [],
      });
      setSelectedItems({
        medicines: {},
        lab_tests: {},
        instructions: {},
        follow_ups: {},
        notes: {},
        unparsed: {},
      });
    }
  }, [data]);

  const handleCheckboxChange = (section, itemIndex, checked) => {
    setSelectedItems((prevSelected) => ({
      ...prevSelected,
      [section]: {
        ...prevSelected[section],
        [itemIndex]: checked,
      },
    }));
  };

  const handlePrintSelected = () => {
    const selectedData = {};
    for (const section in selectedItems) {
      selectedData[section] = [];
      const items = medicalData[section] || [];
      for (let i = 0; i < items.length; i++) {
        if (selectedItems[section][i]) {
          selectedData[section].push(items[i]);
        }
      }
    }
    console.log("Selected Data:", selectedData);
  };

  const hasData = Object.values(medicalData).some(
    (arr) => arr && arr.length > 0
  );

  if (!hasData) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh", // optional if parent handles height
          width: "100%",
          width:"40vw"
        }}
      >
        
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          padding: 2,
          fontSize: "12px",
          height: "80vh",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontSize: "1.1rem", display: "flex", alignItems: "center" }}
        >
          <HealingOutlined sx={{ mr: 1 }} /> Medicines
        </Typography>
        {medicalData.medicines && (
          <MedicinesTable
            medicines={medicalData.medicines}
            selected={selectedItems.medicines}
            onSelect={(index, checked) =>
              handleCheckboxChange("medicines", index, checked)
            }
          />
        )}

        <br />
        <Divider />

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            pt: 1,
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ScienceOutlined sx={{ mr: 1 }} /> Lab Tests
        </Typography>

        {medicalData.lab_tests && medicalData.lab_tests.length > 0 ? (
          <List>
            {medicalData.lab_tests.map((test, index) => (
              <DataListItem
                key={`lab-test-${index}`}
                item={test}
                index={index}
                sectionKey="lab_tests"
                selected={selectedItems.lab_tests}
                onSelect={(idx, checked) =>
                  handleCheckboxChange("lab_tests", idx, checked)
                }
              />
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No lab tests recorded.
          </Typography>
        )}
        <Divider />

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            pt: 1,
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <AssignmentOutlined sx={{ mr: 1 }} /> Instructions
        </Typography>
        {medicalData.instructions && medicalData.instructions.length > 0 ? (
          <List>
            {medicalData.instructions.map((instruction, index) => (
              <DataListItem
                key={`instruction-${index}`}
                item={instruction}
                index={index}
                sectionKey="instructions"
                selected={selectedItems.instructions}
                onSelect={(idx, checked) =>
                  handleCheckboxChange("instructions", idx, checked)
                }
              />
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No specific instructions.
          </Typography>
        )}
        <Divider />

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            pt: 1,
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <EventNoteOutlined sx={{ mr: 1 }} /> Follow Ups
        </Typography>
        {medicalData.follow_ups && medicalData.follow_ups.length > 0 ? (
          <List>
            {medicalData.follow_ups.map((followUp, index) => (
              <DataListItem
                key={`follow-up-${index}`}
                item={followUp}
                index={index}
                sectionKey="follow_ups"
                selected={selectedItems.follow_ups}
                onSelect={(idx, checked) =>
                  handleCheckboxChange("follow_ups", idx, checked)
                }
              />
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No follow-up appointments scheduled.
          </Typography>
        )}

        <Divider />

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            pt: 1,
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <NoteOutlined sx={{ mr: 1 }} /> Notes
        </Typography>
        {medicalData.notes && medicalData.notes.length > 0 ? (
          <List>
            {medicalData.notes.map((note, index) => (
              <DataListItem
                key={`note-${index}`}
                item={note}
                index={index}
                sectionKey="notes"
                selected={selectedItems.notes}
                onSelect={(idx, checked) =>
                  handleCheckboxChange("notes", idx, checked)
                }
              />
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No additional notes.
          </Typography>
        )}
      </Box>

      <Box p={1} sx={{ backgroundColor: "white", ml: "auto" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePrintSelected}
          sx={{ fontSize: "12px" }}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default MedicalDataRenderer;
