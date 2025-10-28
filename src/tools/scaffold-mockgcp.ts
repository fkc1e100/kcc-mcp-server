import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

export interface ScaffoldMockGCPParams {
  resource: string;
  service: string;
  proto_package: string;
  proto_message: string;
  resource_name_format: string;
}

export function scaffoldMockGCP(repoPath: string, params: ScaffoldMockGCPParams): string {
  const resourceLower = params.resource.toLowerCase();
  const targetPath = join(repoPath, 'mockgcp', `mock${params.service}`, `${resourceLower}.go`);

  if (existsSync(targetPath)) {
    throw new Error(`MockGCP file already exists: ${targetPath}`);
  }

  // Ensure directory exists
  mkdirSync(dirname(targetPath), { recursive: true });

  const content = generateMockGCPTemplate(params);
  writeFileSync(targetPath, content, 'utf-8');

  return `✅ Created MockGCP file: mockgcp/mock${params.service}/${resourceLower}.go\n\n` +
    `Next steps:\n` +
    `1. Register server in mockgcp/mock${params.service}/service.go\n` +
    `2. Create test fixtures in pkg/test/resourcefixture/testdata/\n` +
    `3. Run tests with E2E_GCP_TARGET=mock`;
}

function generateMockGCPTemplate(params: ScaffoldMockGCPParams): string {
  const year = new Date().getFullYear();
  const resourceTitle = params.resource;
  const resourceLower = params.resource.toLowerCase();

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

package mock${params.service}

import (
	"context"
	"fmt"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/GoogleCloudPlatform/k8s-config-connector/mockgcp/common/projects"
	pb "${params.proto_package}pb"
	"github.com/GoogleCloudPlatform/k8s-config-connector/mockgcp/pkg/storage"
	longrunningpb "google.golang.org/genproto/googleapis/longrunning"
)

func (s *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}Server) Get${resourceTitle}(ctx context.Context, req *pb.Get${resourceTitle}Request) (*pb.${resourceTitle}, error) {
	name, err := s.parse${resourceTitle}Name(req.Name)
	if err != nil {
		return nil, err
	}

	fqn := name.String()

	obj := &pb.${resourceTitle}{}
	if err := s.storage.Get(ctx, fqn, obj); err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, "Resource '%s' was not found", fqn)
		}
		return nil, err
	}

	return obj, nil
}

func (s *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}Server) List${resourceTitle}s(ctx context.Context, req *pb.List${resourceTitle}sRequest) (*pb.List${resourceTitle}sResponse, error) {
	response := &pb.List${resourceTitle}sResponse{}

	findKind := (&pb.${resourceTitle}{}).ProtoReflect().Descriptor()
	if err := s.storage.List(ctx, findKind, storage.ListOptions{
		Prefix: req.Parent + "/${resourceLower}s/",
	}, func(obj proto.Message) error {
		item := obj.(*pb.${resourceTitle})
		response.${resourceTitle}s = append(response.${resourceTitle}s, item)
		return nil
	}); err != nil {
		return nil, err
	}

	return response, nil
}

func (s *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}Server) Create${resourceTitle}(ctx context.Context, req *pb.Create${resourceTitle}Request) (*longrunningpb.Operation, error) {
	reqName := req.Parent + "/${resourceLower}s/" + req.${resourceTitle}Id
	name, err := s.parse${resourceTitle}Name(reqName)
	if err != nil {
		return nil, err
	}

	fqn := name.String()
	now := time.Now()

	obj := proto.Clone(req.${resourceTitle}).(*pb.${resourceTitle})
	obj.Name = fqn

	if err := s.storage.Create(ctx, fqn, obj); err != nil {
		return nil, err
	}

	lroPrefix := fmt.Sprintf("projects/%s/locations/%s", name.Project.ID, name.Location)
	lroMetadata := &pb.OperationMetadata{
		CreateTime: timestamppb.New(now),
		EndTime:    timestamppb.New(now),
		Target:     fqn,
		Verb:       "create",
		ApiVersion: "v1",
	}

	return s.operations.StartLRO(ctx, lroPrefix, lroMetadata, func() (proto.Message, error) {
		result := proto.Clone(obj).(*pb.${resourceTitle})
		return result, nil
	})
}

func (s *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}Server) Update${resourceTitle}(ctx context.Context, req *pb.Update${resourceTitle}Request) (*longrunningpb.Operation, error) {
	name, err := s.parse${resourceTitle}Name(req.${resourceTitle}.Name)
	if err != nil {
		return nil, err
	}

	fqn := name.String()

	existing := &pb.${resourceTitle}{}
	if err := s.storage.Get(ctx, fqn, existing); err != nil {
		return nil, err
	}

	now := time.Now()

	updated := proto.Clone(req.${resourceTitle}).(*pb.${resourceTitle})
	updated.Name = fqn

	if err := s.storage.Update(ctx, fqn, updated); err != nil {
		return nil, err
	}

	lroPrefix := fmt.Sprintf("projects/%s/locations/%s", name.Project.ID, name.Location)
	lroMetadata := &pb.OperationMetadata{
		CreateTime: timestamppb.New(now),
		EndTime:    timestamppb.New(now),
		Target:     fqn,
		Verb:       "update",
		ApiVersion: "v1",
	}

	return s.operations.StartLRO(ctx, lroPrefix, lroMetadata, func() (proto.Message, error) {
		result := proto.Clone(updated).(*pb.${resourceTitle})
		return result, nil
	})
}

func (s *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}Server) Delete${resourceTitle}(ctx context.Context, req *pb.Delete${resourceTitle}Request) (*longrunningpb.Operation, error) {
	name, err := s.parse${resourceTitle}Name(req.Name)
	if err != nil {
		return nil, err
	}

	fqn := name.String()

	deleted := &pb.${resourceTitle}{}
	if err := s.storage.Delete(ctx, fqn, deleted); err != nil {
		return nil, err
	}

	now := time.Now()
	lroMetadata := &pb.OperationMetadata{
		CreateTime: timestamppb.New(now),
		EndTime:    timestamppb.New(now),
		Target:     fqn,
		Verb:       "delete",
		ApiVersion: "v1",
	}

	lroPrefix := fmt.Sprintf("projects/%s/locations/%s", name.Project.ID, name.Location)
	return s.operations.DoneLRO(ctx, lroPrefix, lroMetadata, &emptypb.Empty{})
}

type ${resourceLower}Name struct {
	Project  *projects.ProjectData
	Location string
	${resourceTitle}Name string
}

func (n *${resourceLower}Name) String() string {
	// Format: ${params.resource_name_format}
	return fmt.Sprintf("${params.resource_name_format.replace('{project}', '%s').replace('{location}', '%s').replace(new RegExp(`\\{${resourceLower}\\}`), '%s')}",
		n.Project.ID, n.Location, n.${resourceTitle}Name)
}

// parse${resourceTitle}Name parses a string into a ${resourceLower}Name.
// Expected form: ${params.resource_name_format}
func (s *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}Server) parse${resourceTitle}Name(name string) (*${resourceLower}Name, error) {
	tokens := strings.Split(name, "/")

	// TODO: Adjust parsing based on actual resource name format
	if len(tokens) == 6 && tokens[0] == "projects" && tokens[2] == "locations" && tokens[4] == "${resourceLower}s" {
		project, err := s.Projects.GetProjectByID(tokens[1])
		if err != nil {
			return nil, err
		}

		return &${resourceLower}Name{
			Project:  project,
			Location: tokens[3],
			${resourceTitle}Name: tokens[5],
		}, nil
	}

	return nil, status.Errorf(codes.InvalidArgument, "name %q is not valid", name)
}
`;
}
