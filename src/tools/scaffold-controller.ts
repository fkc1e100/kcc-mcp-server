import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

export interface ScaffoldControllerParams {
  resource: string;
  service: string;
  version: string;
  proto_package: string;
  proto_message: string;
}

export function scaffoldController(repoPath: string, params: ScaffoldControllerParams): string {
  const resourceLower = params.resource.toLowerCase();
  const targetPath = join(repoPath, 'pkg', 'controller', 'direct', params.service, `${resourceLower}_controller.go`);

  if (existsSync(targetPath)) {
    throw new Error(`Controller file already exists: ${targetPath}`);
  }

  // Ensure directory exists
  mkdirSync(dirname(targetPath), { recursive: true });

  const content = generateControllerTemplate(params);
  writeFileSync(targetPath, content, 'utf-8');

  return `✅ Created controller file: pkg/controller/direct/${params.service}/${resourceLower}_controller.go\n\n` +
    `Next steps:\n` +
    `1. Implement GCP API calls in Find, Create, Update, Delete methods\n` +
    `2. Add field mask logic for Update\n` +
    `3. Implement reference resolution if needed\n` +
    `4. Use: kcc_scaffold_mockgcp to create MockGCP implementation`;
}

function generateControllerTemplate(params: ScaffoldControllerParams): string {
  const year = new Date().getFullYear();
  const resourceTitle = params.resource;
  const gvk = `${params.service.charAt(0).toUpperCase() + params.service.slice(1)}${resourceTitle}`;
  const model = `${resourceTitle}Model`;
  const adapter = `${resourceTitle}Adapter`;

  return `// Copyright ${year} Google LLC
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

package ${params.service}

import (
	"context"
	"fmt"

	krm "github.com/GoogleCloudPlatform/k8s-config-connector/apis/${params.service}/${params.version}"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/config"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/controller/direct"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/controller/direct/directbase"
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/controller/direct/registry"

	gcp "cloud.google.com/go/${params.service}/apiv1"
	pb "cloud.google.com/go/${params.service}/apiv1/${params.service}pb"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func init() {
	registry.RegisterModel(krm.${gvk}GVK, New${model})
}

func New${model}(ctx context.Context, config *config.ControllerConfig) (directbase.Model, error) {
	return &${model}{config: *config}, nil
}

var _ directbase.Model = &${model}{}

type ${model} struct {
	config config.ControllerConfig
}

func (m *${model}) AdapterForObject(ctx context.Context, reader client.Reader, u *unstructured.Unstructured) (directbase.Adapter, error) {
	obj := &krm.${gvk}{}
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(u.Object, &obj); err != nil {
		return nil, fmt.Errorf("error converting to %T: %w", obj, err)
	}

	id, err := krm.New${resourceTitle}Identity(ctx, reader, obj)
	if err != nil {
		return nil, err
	}

	// TODO: Get GCP client
	// gcpClient, err := newGCPClient(ctx, &m.config)
	// if err != nil {
	// 	return nil, err
	// }

	return &${adapter}{
		// gcpClient: gcpClient,
		id:      id,
		desired: obj,
		reader:  reader,
	}, nil
}

func (m *${model}) AdapterForURL(ctx context.Context, url string) (directbase.Adapter, error) {
	// TODO: Support URLs
	return nil, nil
}

type ${adapter} struct {
	// gcpClient *gcp.Client
	id      *krm.${resourceTitle}Identity
	desired *krm.${gvk}
	actual  *pb.${params.proto_message}
	reader  client.Reader
}

var _ directbase.Adapter = &${adapter}{}

// Find retrieves the GCP resource.
func (a *${adapter}) Find(ctx context.Context) (bool, error) {
	log := klog.FromContext(ctx)
	log.V(2).Info("getting ${resourceTitle}", "name", a.id)

	// TODO: Implement Find using GCP client
	// req := &pb.Get${params.proto_message}Request{Name: a.id.String()}
	// obj, err := a.gcpClient.Get${params.proto_message}(ctx, req)
	// if err != nil {
	// 	if direct.IsNotFound(err) {
	// 		return false, nil
	// 	}
	// 	return false, fmt.Errorf("getting ${resourceTitle} %q: %w", a.id, err)
	// }
	// a.actual = obj
	// return true, nil

	return false, nil // Temporary
}

func (a *${adapter}) resolveReferences(ctx context.Context) error {
	// TODO: Implement reference resolution if needed
	return nil
}

// Create creates the resource in GCP.
func (a *${adapter}) Create(ctx context.Context, createOp *directbase.CreateOperation) error {
	log := klog.FromContext(ctx)
	log.V(2).Info("creating ${resourceTitle}", "name", a.id)

	if err := a.resolveReferences(ctx); err != nil {
		return err
	}

	mapCtx := &direct.MapContext{}
	desired := a.desired.DeepCopy()
	resource := ${gvk}Spec_ToProto(mapCtx, &desired.Spec)
	if mapCtx.Err() != nil {
		return mapCtx.Err()
	}

	// TODO: Implement Create using GCP client
	// req := &pb.Create${params.proto_message}Request{
	// 	Parent:   a.id.Parent().String(),
	// 	${params.proto_message}Id: a.id.ID(),
	// 	${params.proto_message}:   resource,
	// }
	// op, err := a.gcpClient.Create${params.proto_message}(ctx, req)
	// if err != nil {
	// 	return fmt.Errorf("creating ${resourceTitle} %s: %w", a.id, err)
	// }
	// created, err := op.Wait(ctx)
	// if err != nil {
	// 	return fmt.Errorf("${resourceTitle} %s waiting creation: %w", a.id, err)
	// }
	// log.V(2).Info("successfully created ${resourceTitle}", "name", a.id)

	// status := &krm.${gvk}Status{}
	// status.ObservedState = ${gvk}ObservedState_FromProto(mapCtx, created)
	// if mapCtx.Err() != nil {
	// 	return mapCtx.Err()
	// }
	// status.ExternalRef = direct.LazyPtr(a.id.String())
	// return createOp.UpdateStatus(ctx, status, nil)

	_ = resource // Temporary
	return fmt.Errorf("${resourceTitle} Create not yet implemented")
}

// Update updates the resource in GCP.
func (a *${adapter}) Update(ctx context.Context, updateOp *directbase.UpdateOperation) error {
	log := klog.FromContext(ctx)
	log.V(2).Info("updating ${resourceTitle}", "name", a.id)

	if err := a.resolveReferences(ctx); err != nil {
		return err
	}

	mapCtx := &direct.MapContext{}
	desired := a.desired.DeepCopy()
	resource := ${gvk}Spec_ToProto(mapCtx, &desired.Spec)
	if mapCtx.Err() != nil {
		return mapCtx.Err()
	}

	// TODO: Implement Update using GCP client
	// TODO: Build field mask for changed fields
	// resource.Name = a.id.String()
	// req := &pb.Update${params.proto_message}Request{
	// 	${params.proto_message}: resource,
	// 	UpdateMask: &fieldmaskpb.FieldMask{Paths: paths},
	// }
	// op, err := a.gcpClient.Update${params.proto_message}(ctx, req)
	// if err != nil {
	// 	return fmt.Errorf("updating ${resourceTitle} %s: %w", a.id, err)
	// }
	// updated, err := op.Wait(ctx)
	// if err != nil {
	// 	return fmt.Errorf("${resourceTitle} %s waiting update: %w", a.id, err)
	// }
	// log.V(2).Info("successfully updated ${resourceTitle}", "name", a.id)

	// status := &krm.${gvk}Status{}
	// status.ObservedState = ${gvk}ObservedState_FromProto(mapCtx, updated)
	// if mapCtx.Err() != nil {
	// 	return mapCtx.Err()
	// }
	// status.ExternalRef = direct.LazyPtr(a.id.String())
	// return updateOp.UpdateStatus(ctx, status, nil)

	_ = resource // Temporary
	return fmt.Errorf("${resourceTitle} Update not yet implemented")
}

// Export maps the GCP object to a Config Connector resource spec.
func (a *${adapter}) Export(ctx context.Context) (*unstructured.Unstructured, error) {
	if a.actual == nil {
		return nil, fmt.Errorf("Find() not called")
	}

	u := &unstructured.Unstructured{}
	obj := &krm.${gvk}{}
	mapCtx := &direct.MapContext{}
	obj.Spec = direct.ValueOf(${gvk}Spec_FromProto(mapCtx, a.actual))
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
	u.SetGroupVersionKind(krm.${gvk}GVK)
	u.Object = uObj

	return u, nil
}

// Delete deletes the resource from GCP.
func (a *${adapter}) Delete(ctx context.Context, deleteOp *directbase.DeleteOperation) (bool, error) {
	log := klog.FromContext(ctx)
	log.V(2).Info("deleting ${resourceTitle}", "name", a.id)

	// TODO: Implement Delete using GCP client
	// req := &pb.Delete${params.proto_message}Request{Name: a.id.String()}
	// op, err := a.gcpClient.Delete${params.proto_message}(ctx, req)
	// if err != nil {
	// 	if direct.IsNotFound(err) {
	// 		return true, nil
	// 	}
	// 	return false, fmt.Errorf("deleting ${resourceTitle} %s: %w", a.id, err)
	// }
	// log.V(2).Info("successfully deleted ${resourceTitle}", "name", a.id)
	// err = op.Wait(ctx)
	// if err != nil {
	// 	return false, fmt.Errorf("waiting delete ${resourceTitle} %s: %w", a.id, err)
	// }
	// return true, nil

	return true, nil // Temporary
}
`;
}
