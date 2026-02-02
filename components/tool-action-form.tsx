"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Code, LayoutList, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export interface ActionFormState {
  name: string;
  display_name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  parameters_json: string;
  params_mapping_json: string;
  sort_order: number;
  is_enabled: boolean;
}

interface ParameterItem {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

interface KeyValueItem {
  key: string;
  value: string;
}

interface ParamsMappingUI {
  query: KeyValueItem[];
  body: KeyValueItem[]; // Simplification for key-value body
  headers: KeyValueItem[];
}

interface ToolActionFormProps {
  initialData: ActionFormState;
  onSubmit: (data: ActionFormState) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function ToolActionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Lưu Action",
}: ToolActionFormProps) {
  const [formData, setFormData] = useState<ActionFormState>(initialData);
  const [mode, setMode] = useState<"ui" | "code">("ui");

  // UI States derived from JSON
  const [parameters, setParameters] = useState<ParameterItem[]>([]);
  const [mapping, setMapping] = useState<ParamsMappingUI>({
    query: [],
    body: [],
    headers: [],
  });

  // Sync JSON to UI state when entering UI mode
  useEffect(() => {
    if (mode === "ui") {
      try {
        // Parse Parameters
        const paramsSchema = JSON.parse(formData.parameters_json);
        const props = paramsSchema.properties || {};
        const required = paramsSchema.required || [];
        
        const newParams: ParameterItem[] = Object.entries(props).map(
          ([key, value]: [string, any]) => ({
            name: key,
            type: value.type || "string",
            description: value.description || "",
            required: required.includes(key),
          })
        );
        setParameters(newParams);

        // Parse Mapping
        const mapConfig = JSON.parse(formData.params_mapping_json);
        setMapping({
          query: Object.entries(mapConfig.query || {}).map(([k, v]) => ({
            key: k,
            value: String(v),
          })),
          body: Object.entries(mapConfig.body || {}).map(([k, v]) => ({
            key: k,
            value: String(v),
          })),
          headers: Object.entries(mapConfig.headers || {}).map(([k, v]) => ({
            key: k,
            value: String(v),
          })),
        });
      } catch (e) {
        console.error("Error parsing JSON for UI mode", e);
        // Fallback to code mode if JSON is invalid
        // toast.error("JSON hiện tại không tương thích với chế độ UI Builder. Đã chuyển sang Code mode.");
        // setMode("code");
      }
    }
  }, [mode, formData.parameters_json, formData.params_mapping_json]);

  // Sync UI state to JSON when submitting or switching to Code
  const syncUiToJson = () => {
    // 1. Build Parameters Schema
    const properties: Record<string, any> = {};
    const requiredList: string[] = [];
    
    parameters.forEach(p => {
      if (p.name) {
        properties[p.name] = {
          type: p.type,
          description: p.description
        };
        if (p.required) requiredList.push(p.name);
      }
    });

    const schema = {
      type: "OBJECT",
      properties,
      required: requiredList
    };

    // 2. Build Mapping Config
    const mappingConfig: any = {};
    
    if (mapping.query.length > 0) {
      mappingConfig.query = mapping.query.reduce((acc, item) => {
        if (item.key) acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
    }
    
    if (mapping.body.length > 0) {
      mappingConfig.body = mapping.body.reduce((acc, item) => {
        if (item.key) acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
    }

    if (mapping.headers.length > 0) {
      mappingConfig.headers = mapping.headers.reduce((acc, item) => {
        if (item.key) acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
    }

    return {
      parameters_json: JSON.stringify(schema, null, 2),
      params_mapping_json: JSON.stringify(mappingConfig, null, 2)
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "ui") {
      const jsonUpdates = syncUiToJson();
      onSubmit({ ...formData, ...jsonUpdates });
    } else {
      onSubmit(formData);
    }
  };

  // --- Parameter Helpers ---
  const addParameter = () => {
    setParameters([...parameters, { name: "", type: "string", description: "", required: false }]);
  };
  
  const removeParameter = (index: number) => {
    const newParams = [...parameters];
    newParams.splice(index, 1);
    setParameters(newParams);
  };

  const updateParameter = (index: number, field: keyof ParameterItem, value: any) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setParameters(newParams);
  };

  // --- Mapping Helpers ---
  const addMappingItem = (type: "query" | "body" | "headers") => {
    setMapping({
      ...mapping,
      [type]: [...mapping[type], { key: "", value: "" }]
    });
  };

  const removeMappingItem = (type: "query" | "body" | "headers", index: number) => {
    const newList = [...mapping[type]];
    newList.splice(index, 1);
    setMapping({ ...mapping, [type]: newList });
  };

  const updateMappingItem = (type: "query" | "body" | "headers", index: number, field: keyof KeyValueItem, value: string) => {
    const newList = [...mapping[type]];
    newList[index] = { ...newList[index], [field]: value };
    setMapping({ ...mapping, [type]: newList });
  };

  const insertParamTemplate = (type: "query" | "body" | "headers", index: number, paramName: string) => {
     const currentVal = mapping[type][index].value;
     updateMappingItem(type, index, "value", currentVal + `{{${paramName}}}`);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Tên hiển thị <span className="text-destructive">*</span></Label>
          <Input 
            value={formData.display_name}
            onChange={(e) => {
               const val = e.target.value;
               const name = !formData.name && val
                ? val.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_")
                : formData.name;
               setFormData({ ...formData, display_name: val, name });
            }}
            placeholder="Lấy danh sách"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Mã định danh <span className="text-destructive">*</span></Label>
          <Input 
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             placeholder="get_list"
             className="h-8 text-sm font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Mô tả</Label>
        <Textarea 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="text-sm"
          placeholder="Mô tả chức năng của action này..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Endpoint <span className="text-destructive">*</span></Label>
        <div className="flex gap-2">
          <Select 
            value={formData.method}
            onValueChange={(v:any) => setFormData({ ...formData, method: v })}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
          <Input 
             value={formData.endpoint}
             onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
             placeholder="/api/resource"
             className="flex-1 h-8 text-sm font-mono"
          />
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Label className="text-sm font-medium">Cấu hình Parameters & Mapping</Label>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${mode === "ui" ? "font-bold text-primary" : "text-muted-foreground"}`}>UI Builder</span>
          <Switch 
            checked={mode === "code"}
            onCheckedChange={(checked) => setMode(checked ? "code" : "ui")}
          />
          <span className={`text-xs ${mode === "code" ? "font-bold text-primary" : "text-muted-foreground"}`}>Code (JSON)</span>
        </div>
      </div>

      {mode === "code" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Parameters (JSON Schema)</Label>
            <Textarea
              value={formData.parameters_json}
              onChange={(e) => setFormData({ ...formData, parameters_json: e.target.value })}
              rows={6}
              className="text-xs font-mono"
            />
          </div>
          <div className="space-y-2">
             <Label className="text-xs">Params Mapping (JSON)</Label>
             <Textarea
               value={formData.params_mapping_json}
               onChange={(e) => setFormData({ ...formData, params_mapping_json: e.target.value })}
               rows={6}
               className="text-xs font-mono"
             />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Parameters Builder */}
          <div className="space-y-2">
             <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Parameters (Đầu vào từ AI)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addParameter} className="h-6 gap-1 text-primary hover:text-primary">
                   <Plus className="w-3 h-3" /> Thêm Param
                </Button>
             </div>
             
             <div className="space-y-2 border rounded-md p-2 bg-muted/20">
                {parameters.length === 0 && (
                   <p className="text-xs text-center text-muted-foreground py-2">Chưa có tham số nào.</p>
                )}
                {parameters.map((param, idx) => (
                  <div key={idx} className="flex gap-2 items-start group">
                     <div className="w-6 pt-2 flex justify-center text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                     </div>
                     <div className="flex-1 grid gap-2">
                        <div className="flex gap-2">
                           <Input 
                              value={param.name}
                              onChange={(e) => updateParameter(idx, "name", e.target.value)}
                              placeholder="param_name"
                              className="h-7 text-xs font-mono flex-1"
                           />
                           <Select
                              value={param.type}
                              onValueChange={(v: any) => updateParameter(idx, "type", v)}
                           >
                              <SelectTrigger className="h-7 w-[90px] text-xs">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="string">String</SelectItem>
                                 <SelectItem value="number">Number</SelectItem>
                                 <SelectItem value="boolean">Boolean</SelectItem>
                              </SelectContent>
                           </Select>
                           <Button
                              type="button"
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeParameter(idx)}
                           >
                              <Trash2 className="w-3 h-3" />
                           </Button>
                        </div>
                        <Input 
                           value={param.description}
                           onChange={(e) => updateParameter(idx, "description", e.target.value)}
                           placeholder="Mô tả cho AI hiểu..."
                           className="h-7 text-xs"
                        />
                        <div className="flex items-center gap-2">
                           <Switch 
                              checked={param.required}
                              onCheckedChange={(c) => updateParameter(idx, "required", c)}
                              className="scale-75 origin-left"
                           />
                           <span className="text-[10px] text-muted-foreground">Bắt buộc</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* 2. Params Mapping Builder */}
          <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">Params Mapping (Gửi đi gọi API)</Label>
             <Tabs defaultValue="query" className="w-full">
                <TabsList className="w-full h-8 grid grid-cols-3">
                   <TabsTrigger value="query" className="text-xs">Query Params</TabsTrigger>
                   <TabsTrigger value="body" className="text-xs">Body (JSON)</TabsTrigger>
                   <TabsTrigger value="headers" className="text-xs">Headers</TabsTrigger>
                </TabsList>

                {["query", "body", "headers"].map((type) => (
                   <TabsContent key={type} value={type} className="space-y-2 mt-2">
                      <div className="space-y-2 border rounded-md p-2 bg-muted/20 min-h-[100px]">
                         {(mapping as any)[type].length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-4">
                               Chưa có cấu hình cho {type}.
                            </p>
                         )}
                         {(mapping as any)[type].map((item: KeyValueItem, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                               <Input 
                                  value={item.key}
                                  onChange={(e) => updateMappingItem(type as any, idx, "key", e.target.value)}
                                  placeholder="Key"
                                  className="h-7 text-xs font-mono w-1/3"
                               />
                               <div className="flex-1 relative">
                                  <Input 
                                    value={item.value}
                                    onChange={(e) => updateMappingItem(type as any, idx, "value", e.target.value)}
                                    placeholder="Value / {{template}}"
                                    className="h-7 text-xs font-mono w-full pr-6"
                                  />
                                  {/* Quick suggestion button could go here */}
                               </div>
                               <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeMappingItem(type as any, idx)}
                               >
                                  <Trash2 className="w-3 h-3" />
                               </Button>
                            </div>
                         ))}
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex gap-1 overflow-x-auto max-w-[70%] no-scrollbar">
                            {parameters.map(p => (
                               <Badge 
                                  key={p.name} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-primary/10 text-[10px] whitespace-nowrap"
                                  onClick={() => {
                                     // Just copy to clipboard or insert to focused input? 
                                     // For simplicity let's just show them as available
                                     // Ideally, we focus last input and insert.
                                     toast.info("Param copied", { description: `{{${p.name}}}` });
                                     navigator.clipboard.writeText(`{{${p.name}}}`);
                                  }}
                               >
                                  {`{{${p.name}}}`}
                               </Badge>
                            ))}
                         </div>
                         <Button 
                           type="button" variant="outline" size="sm" 
                           onClick={() => addMappingItem(type as any)}
                           className="h-6 text-xs"
                         >
                            <Plus className="w-3 h-3 mr-1" /> Thêm Key
                         </Button>
                      </div>
                   </TabsContent>
                ))}
             </Tabs>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
         <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Hủy</Button>
         <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <span className="mr-2 animate-spin">⏳</span>}
             {submitLabel}
         </Button>
      </div>
    </form>
  );
}
