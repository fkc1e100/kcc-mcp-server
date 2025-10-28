# Example: Adding defaultCustomErrorResponsePolicy to ComputeURLMap

This example demonstrates adding a new field to an existing direct controller.

## Task
Add support for `defaultCustomErrorResponsePolicy` field to the `ComputeURLMap` CRD.

## Steps

### 1. Find the Resource
```
Tool: kcc_find_resource
Input: { "resource": "ComputeURLMap" }
```

Expected output:
```json
{
  "resource": "computeurlmap",
  "service": "compute",
  "version": "v1beta1",
  "types_file": "apis/compute/v1beta1/computeurlmap_types.go",
  "controller_file": "pkg/controller/direct/compute/computeurlmap_controller.go",
  "mapper_file": "pkg/controller/direct/compute/mapper.generated.go",
  "test_fixtures_dir": "pkg/test/resourcefixture/testdata/basic/compute/v1beta1/computeurlmap",
  "files_exist": {
    "types": true,
    "controller": true,
    "mapper": true,
    "test_fixtures": true
  }
}
```

### 2. Add the Field
```
Tool: kcc_add_field
Input: {
  "resource": "ComputeURLMap",
  "field_name": "DefaultCustomErrorResponsePolicy",
  "field_type": "string",
  "proto_path": "google.cloud.compute.v1.UrlMap.default_custom_error_response_policy",
  "parent_type": "ComputeURLMapSpec",
  "description": "DefaultCustomErrorResponsePolicy specifies the default custom error response policy"
}
```

This adds to `apis/compute/v1beta1/computeurlmap_types.go`:
```go
// DefaultCustomErrorResponsePolicy specifies the default custom error response policy
// +kcc:proto=google.cloud.compute.v1.UrlMap.default_custom_error_response_policy
DefaultCustomErrorResponsePolicy *string `json:"defaultCustomErrorResponsePolicy,omitempty"`
```

### 3. Generate Mapper
```
Tool: kcc_generate_mapper
Input: { "resource": "ComputeURLMap" }
```

This regenerates `pkg/controller/direct/compute/mapper.generated.go` with conversion functions for the new field.

### 4. Update Test Fixtures
Manually update (or use tool when implemented):

**pkg/test/resourcefixture/testdata/basic/compute/v1beta1/computeurlmap/create.yaml**:
```yaml
spec:
  # ... existing fields ...
  defaultCustomErrorResponsePolicy: "ALLOW"
```

**update.yaml**:
```yaml
spec:
  # ... existing fields ...
  defaultCustomErrorResponsePolicy: "DENY"
```

### 5. Run Tests
```bash
cd k8s-config-connector
export E2E_GCP_TARGET=mock
go test ./pkg/test/resourcefixture/ -run TestResourceFixture/computeurlmap -v
```

### 6. Format Code
```bash
make fmt
```

### 7. Check Status
```
Tool: kcc_git_status
```

Should show:
```
M apis/compute/v1beta1/computeurlmap_types.go
M pkg/controller/direct/compute/mapper.generated.go
M apis/compute/v1beta1/zz_generated.deepcopy.go
M pkg/test/resourcefixture/testdata/basic/compute/v1beta1/computeurlmap/create.yaml
M pkg/test/resourcefixture/testdata/basic/compute/v1beta1/computeurlmap/update.yaml
```

### 8. Commit
```
Tool: kcc_git_commit
Input: {
  "message": "feat: Add defaultCustomErrorResponsePolicy to ComputeURLMap

- Add defaultCustomErrorResponsePolicy field to ComputeURLMapSpec
- Regenerate mapper for KRM ↔ Proto conversions
- Update test fixtures with field in both create and update scenarios"
}
```

**✅ The tool will automatically:**
- Block any AI attribution in the message
- Use your configured git identity (from config or git config)
- Validate conventional commit format
- Create the commit

### 9. Push and Create PR
```bash
git push fork feature/add-default-custom-error-response-policy
gh pr create --title "feat: Add defaultCustomErrorResponsePolicy to ComputeURLMap"
```

## What The MCP Server Prevents

### ❌ BLOCKED - AI Attribution
```
Tool: kcc_git_commit
Input: {
  "message": "feat: Add field\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
}
```

**Error**:
```
❌ BLOCKED: Commit message contains 'co-authored-by: claude'

AI attribution is not allowed in k8s-config-connector contributions.
Remove all references to AI tools from commit messages.

This rule is enforced for ALL contributors.
```

### ❌ BLOCKED - Git Config Mismatch
If your git config doesn't match the MCP server config:

**Error**:
```
⚠️  Git config mismatch!

Current in repository: Wrong Name <wrong@email.com>
Expected from config: Frank Currie <fcurrie@google.com>

Run in /path/to/k8s-config-connector:
  git config user.email "fcurrie@google.com"
  git config user.name "Frank Currie"
```

## Benefits

1. **No Manual Proto Annotation Errors**: Tool ensures correct `+kcc:proto=` format
2. **Automatic Mapper Generation**: No need to remember the command
3. **Git Safety**: Impossible to commit with AI attribution
4. **Consistent Workflow**: Same steps for any field addition
5. **Type Safety**: Tool validates field types and proto paths
