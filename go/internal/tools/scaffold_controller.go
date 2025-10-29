package tools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ScaffoldControllerParams contains parameters for scaffolding controller
type ScaffoldControllerParams struct {
	Resource     string `json:"resource"`
	Service      string `json:"service"`
	Version      string `json:"version"`
	ProtoPackage string `json:"proto_package"`
	ProtoMessage string `json:"proto_message"`
}

// ScaffoldController generates controller file
func ScaffoldController(repoPath string, params ScaffoldControllerParams) (string, error) {
	resourceLower := strings.ToLower(params.Resource)
	targetPath := filepath.Join(repoPath, "pkg", "controller", "direct", params.Service, fmt.Sprintf("%s_controller.go", resourceLower))

	if fileExists(targetPath) {
		return "", fmt.Errorf("controller file already exists: %s", targetPath)
	}

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	content := generateControllerTemplate(params)
	if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("✅ Created controller file: pkg/controller/direct/%s/%s_controller.go\n\n"+
		"Next steps:\n"+
		"1. Implement GCP API calls in Find, Create, Update, Delete methods\n"+
		"2. Add field mask logic for Update\n"+
		"3. Implement reference resolution if needed\n"+
		"4. Use: kcc_scaffold_mockgcp to create MockGCP implementation",
		params.Service, resourceLower), nil
}

func generateControllerTemplate(params ScaffoldControllerParams) string {
	year := time.Now().Year()
	resourceTitle := params.Resource
	gvk := fmt.Sprintf("%s%s", strings.Title(params.Service), resourceTitle)
	model := fmt.Sprintf("%sModel", resourceTitle)
	adapter := fmt.Sprintf("%sAdapter", resourceTitle)

	return fmt.Sprintf(`// Copyright %d Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package %s

import (
	"context"
	"fmt"

	krm "github.com/GoogleCloudPlatform/k8s-config-connector/apis/%s/%s"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/config"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/controller/direct"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/controller/direct/directbase"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/controller/direct/registry"

	gcp "cloud.google.com/go/%s/apiv1"
	pb "cloud.google.com/go/%s/apiv1/%spb"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func init() {
	registry.RegisterModel(krm.%sGVK, New%s)
}

func New%s(ctx context.Context, config *config.ControllerConfig) (directbase.Model, error) {
	return &%s{config: *config}, nil
}

var _ directbase.Model = &%s{}

type %s struct {
	config config.ControllerConfig
}

func (m *%s) AdapterForObject(ctx context.Context, reader client.Reader, u *unstructured.Unstructured) (directbase.Adapter, error) {
	obj := &krm.%s{}
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(u.Object, &obj); err != nil {
		return nil, fmt.Errorf("error converting to %%T: %%w", obj, err)
	}

	id, err := krm.New%sIdentity(ctx, reader, obj)
	if err != nil {
		return nil, err
	}

	// TODO: Get GCP client
	// gcpClient, err := newGCPClient(ctx, &m.config)
	// if err != nil {
	// 	return nil, err
	// }

	return &%s{
		// gcpClient: gcpClient,
		id:      id,
		desired: obj,
		reader:  reader,
	}, nil
}

func (m *%s) AdapterForURL(ctx context.Context, url string) (directbase.Adapter, error) {
	// TODO: Support URLs
	return nil, nil
}

type %s struct {
	// gcpClient *gcp.Client
	id      *krm.%sIdentity
	desired *krm.%s
	actual  *pb.%s
	reader  client.Reader
}

var _ directbase.Adapter = &%s{}

// Find retrieves the GCP resource.
func (a *%s) Find(ctx context.Context) (bool, error) {
	log := klog.FromContext(ctx)
	log.V(2).Info("getting %s", "name", a.id)

	// TODO: Implement Find using GCP client
	// req := &pb.Get%sRequest{Name: a.id.String()}
	// obj, err := a.gcpClient.Get%s(ctx, req)
	// if err != nil {
	// 	if direct.IsNotFound(err) {
	// 		return false, nil
	// 	}
	// 	return false, fmt.Errorf("getting %s %%q: %%w", a.id, err)
	// }
	// a.actual = obj
	// return true, nil

	return false, nil // Temporary
}

func (a *%s) resolveReferences(ctx context.Context) error {
	// TODO: Implement reference resolution if needed
	return nil
}

// Create creates the resource in GCP.
func (a *%s) Create(ctx context.Context, createOp *directbase.CreateOperation) error {
	log := klog.FromContext(ctx)
	log.V(2).Info("creating %s", "name", a.id)

	if err := a.resolveReferences(ctx); err != nil {
		return err
	}

	mapCtx := &direct.MapContext{}
	desired := a.desired.DeepCopy()
	resource := %sSpec_ToProto(mapCtx, &desired.Spec)
	if mapCtx.Err() != nil {
		return mapCtx.Err()
	}

	// TODO: Implement Create using GCP client
	// req := &pb.Create%sRequest{
	// 	Parent:   a.id.Parent().String(),
	// 	%sId: a.id.ID(),
	// 	%s:   resource,
	// }
	// op, err := a.gcpClient.Create%s(ctx, req)
	// if err != nil {
	// 	return fmt.Errorf("creating %s %%s: %%w", a.id, err)
	// }
	// created, err := op.Wait(ctx)
	// if err != nil {
	// 	return fmt.Errorf("%s %%s waiting creation: %%w", a.id, err)
	// }
	// log.V(2).Info("successfully created %s", "name", a.id)

	// status := &krm.%sStatus{}
	// status.ObservedState = %sObservedState_FromProto(mapCtx, created)
	// if mapCtx.Err() != nil {
	// 	return mapCtx.Err()
	// }
	// status.ExternalRef = direct.LazyPtr(a.id.String())
	// return createOp.UpdateStatus(ctx, status, nil)

	_ = resource // Temporary
	return fmt.Errorf("%s Create not yet implemented")
}

// Update updates the resource in GCP.
func (a *%s) Update(ctx context.Context, updateOp *directbase.UpdateOperation) error {
	log := klog.FromContext(ctx)
	log.V(2).Info("updating %s", "name", a.id)

	if err := a.resolveReferences(ctx); err != nil {
		return err
	}

	mapCtx := &direct.MapContext{}
	desired := a.desired.DeepCopy()
	resource := %sSpec_ToProto(mapCtx, &desired.Spec)
	if mapCtx.Err() != nil {
		return mapCtx.Err()
	}

	// TODO: Implement Update using GCP client
	// TODO: Build field mask for changed fields
	// resource.Name = a.id.String()
	// req := &pb.Update%sRequest{
	// 	%s: resource,
	// 	UpdateMask: &fieldmaskpb.FieldMask{Paths: paths},
	// }
	// op, err := a.gcpClient.Update%s(ctx, req)
	// if err != nil {
	// 	return fmt.Errorf("updating %s %%s: %%w", a.id, err)
	// }
	// updated, err := op.Wait(ctx)
	// if err != nil {
	// 	return fmt.Errorf("%s %%s waiting update: %%w", a.id, err)
	// }
	// log.V(2).Info("successfully updated %s", "name", a.id)

	// status := &krm.%sStatus{}
	// status.ObservedState = %sObservedState_FromProto(mapCtx, updated)
	// if mapCtx.Err() != nil {
	// 	return mapCtx.Err()
	// }
	// status.ExternalRef = direct.LazyPtr(a.id.String())
	// return updateOp.UpdateStatus(ctx, status, nil)

	_ = resource // Temporary
	return fmt.Errorf("%s Update not yet implemented")
}

// Export maps the GCP object to a Config Connector resource spec.
func (a *%s) Export(ctx context.Context) (*unstructured.Unstructured, error) {
	if a.actual == nil {
		return nil, fmt.Errorf("Find() not called")
	}

	u := &unstructured.Unstructured{}
	obj := &krm.%s{}
	mapCtx := &direct.MapContext{}
	obj.Spec = direct.ValueOf(%sSpec_FromProto(mapCtx, a.actual))
	if mapCtx.Err() != nil {
		return nil, mapCtx.Err()
	}

	// TODO: Set project/location refs
	// obj.Spec.ProjectRef = &refsv1beta1.ProjectRef{External: a.id.Parent().ProjectID}
	// obj.Spec.Location = a.id.Parent().Location

	uObj, err := runtime.DefaultUnstructuredConverter.ToUnstructured(obj)
	if err != nil {
		return nil, err
	}

	u.SetName(a.id.ID())
	u.SetGroupVersionKind(krm.%sGVK)
	u.Object = uObj

	return u, nil
}

// Delete deletes the resource from GCP.
func (a *%s) Delete(ctx context.Context, deleteOp *directbase.DeleteOperation) (bool, error) {
	log := klog.FromContext(ctx)
	log.V(2).Info("deleting %s", "name", a.id)

	// TODO: Implement Delete using GCP client
	// req := &pb.Delete%sRequest{Name: a.id.String()}
	// op, err := a.gcpClient.Delete%s(ctx, req)
	// if err != nil {
	// 	if direct.IsNotFound(err) {
	// 		return true, nil
	// 	}
	// 	return false, fmt.Errorf("deleting %s %%s: %%w", a.id, err)
	// }
	// log.V(2).Info("successfully deleted %s", "name", a.id)
	// err = op.Wait(ctx)
	// if err != nil {
	// 	return false, fmt.Errorf("waiting delete %s %%s: %%w", a.id, err)
	// }
	// return true, nil

	return true, nil // Temporary
}
`, year, params.Service, params.Service, params.Version, params.Service, params.Service, params.Service,
		gvk, model, model, model, model, model, model, gvk, resourceTitle, adapter,
		model, adapter, resourceTitle, gvk, params.ProtoMessage, adapter,
		adapter, resourceTitle, params.ProtoMessage, params.ProtoMessage, resourceTitle,
		adapter, adapter, resourceTitle, gvk, params.ProtoMessage,
		params.ProtoMessage, params.ProtoMessage, resourceTitle, resourceTitle, resourceTitle,
		gvk, gvk, resourceTitle, adapter, resourceTitle, gvk,
		params.ProtoMessage, params.ProtoMessage, resourceTitle, resourceTitle,
		resourceTitle, gvk, gvk, resourceTitle, adapter, gvk, gvk,
		gvk, adapter, resourceTitle, params.ProtoMessage, params.ProtoMessage,
		resourceTitle, resourceTitle, resourceTitle)
}
