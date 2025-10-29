package tools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ScaffoldMockGCPParams contains parameters for scaffolding MockGCP
type ScaffoldMockGCPParams struct {
	Resource           string `json:"resource"`
	Service            string `json:"service"`
	ProtoPackage       string `json:"proto_package"`
	ProtoMessage       string `json:"proto_message"`
	ResourceNameFormat string `json:"resource_name_format"`
}

// ScaffoldMockGCP generates MockGCP implementation file
func ScaffoldMockGCP(repoPath string, params ScaffoldMockGCPParams) (string, error) {
	resourceLower := strings.ToLower(params.Resource)
	targetPath := filepath.Join(repoPath, "mockgcp", fmt.Sprintf("mock%s", params.Service), fmt.Sprintf("%s.go", resourceLower))

	if fileExists(targetPath) {
		return "", fmt.Errorf("MockGCP file already exists: %s", targetPath)
	}

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	content := generateMockGCPTemplate(params)
	if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("✅ Created MockGCP file: mockgcp/mock%s/%s.go\n\n"+
		"Next steps:\n"+
		"1. Register server in mockgcp/mock%s/service.go\n"+
		"2. Create test fixtures in pkg/test/resourcefixture/testdata/\n"+
		"3. Run tests with E2E_GCP_TARGET=mock",
		params.Service, resourceLower, params.Service), nil
}

func generateMockGCPTemplate(params ScaffoldMockGCPParams) string {
	year := time.Now().Year()
	resourceTitle := params.Resource
	resourceLower := strings.ToLower(params.Resource)
	serverName := fmt.Sprintf("%sServer", strings.Title(params.Service))

	// Build format string for resource name
	formatStr := params.ResourceNameFormat
	formatStr = strings.ReplaceAll(formatStr, "{project}", "%s")
	formatStr = strings.ReplaceAll(formatStr, "{location}", "%s")
	formatStr = strings.ReplaceAll(formatStr, fmt.Sprintf("{%s}", resourceLower), "%s")

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

package mock%s

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
	pb "%spb"
	"github.com/GoogleCloudPlatform/k8s-config-connector/mockgcp/pkg/storage"
	longrunningpb "google.golang.org/genproto/googleapis/longrunning"
)

func (s *%s) Get%s(ctx context.Context, req *pb.Get%sRequest) (*pb.%s, error) {
	name, err := s.parse%sName(req.Name)
	if err != nil {
		return nil, err
	}

	fqn := name.String()

	obj := &pb.%s{}
	if err := s.storage.Get(ctx, fqn, obj); err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, "Resource '%%s' was not found", fqn)
		}
		return nil, err
	}

	return obj, nil
}

func (s *%s) List%ss(ctx context.Context, req *pb.List%ssRequest) (*pb.List%ssResponse, error) {
	response := &pb.List%ssResponse{}

	findKind := (&pb.%s{}).ProtoReflect().Descriptor()
	if err := s.storage.List(ctx, findKind, storage.ListOptions{
		Prefix: req.Parent + "/%ss/",
	}, func(obj proto.Message) error {
		item := obj.(*pb.%s)
		response.%ss = append(response.%ss, item)
		return nil
	}); err != nil {
		return nil, err
	}

	return response, nil
}

func (s *%s) Create%s(ctx context.Context, req *pb.Create%sRequest) (*longrunningpb.Operation, error) {
	reqName := req.Parent + "/%ss/" + req.%sId
	name, err := s.parse%sName(reqName)
	if err != nil {
		return nil, err
	}

	fqn := name.String()
	now := time.Now()

	obj := proto.Clone(req.%s).(*pb.%s)
	obj.Name = fqn

	if err := s.storage.Create(ctx, fqn, obj); err != nil {
		return nil, err
	}

	lroPrefix := fmt.Sprintf("projects/%%s/locations/%%s", name.Project.ID, name.Location)
	lroMetadata := &pb.OperationMetadata{
		CreateTime: timestamppb.New(now),
		EndTime:    timestamppb.New(now),
		Target:     fqn,
		Verb:       "create",
		ApiVersion: "v1",
	}

	return s.operations.StartLRO(ctx, lroPrefix, lroMetadata, func() (proto.Message, error) {
		result := proto.Clone(obj).(*pb.%s)
		return result, nil
	})
}

func (s *%s) Update%s(ctx context.Context, req *pb.Update%sRequest) (*longrunningpb.Operation, error) {
	name, err := s.parse%sName(req.%s.Name)
	if err != nil {
		return nil, err
	}

	fqn := name.String()

	existing := &pb.%s{}
	if err := s.storage.Get(ctx, fqn, existing); err != nil {
		return nil, err
	}

	now := time.Now()

	updated := proto.Clone(req.%s).(*pb.%s)
	updated.Name = fqn

	if err := s.storage.Update(ctx, fqn, updated); err != nil {
		return nil, err
	}

	lroPrefix := fmt.Sprintf("projects/%%s/locations/%%s", name.Project.ID, name.Location)
	lroMetadata := &pb.OperationMetadata{
		CreateTime: timestamppb.New(now),
		EndTime:    timestamppb.New(now),
		Target:     fqn,
		Verb:       "update",
		ApiVersion: "v1",
	}

	return s.operations.StartLRO(ctx, lroPrefix, lroMetadata, func() (proto.Message, error) {
		result := proto.Clone(updated).(*pb.%s)
		return result, nil
	})
}

func (s *%s) Delete%s(ctx context.Context, req *pb.Delete%sRequest) (*longrunningpb.Operation, error) {
	name, err := s.parse%sName(req.Name)
	if err != nil {
		return nil, err
	}

	fqn := name.String()

	deleted := &pb.%s{}
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

	lroPrefix := fmt.Sprintf("projects/%%s/locations/%%s", name.Project.ID, name.Location)
	return s.operations.DoneLRO(ctx, lroPrefix, lroMetadata, &emptypb.Empty{})
}

type %sName struct {
	Project  *projects.ProjectData
	Location string
	%sName string
}

func (n *%sName) String() string {
	// Format: %s
	return fmt.Sprintf("%s", n.Project.ID, n.Location, n.%sName)
}

// parse%sName parses a string into a %sName.
// Expected form: %s
func (s *%s) parse%sName(name string) (*%sName, error) {
	tokens := strings.Split(name, "/")

	// TODO: Adjust parsing based on actual resource name format
	if len(tokens) == 6 && tokens[0] == "projects" && tokens[2] == "locations" && tokens[4] == "%ss" {
		project, err := s.Projects.GetProjectByID(tokens[1])
		if err != nil {
			return nil, err
		}

		return &%sName{
			Project:  project,
			Location: tokens[3],
			%sName: tokens[5],
		}, nil
	}

	return nil, status.Errorf(codes.InvalidArgument, "name %%q is not valid", name)
}
`, year, params.Service, params.ProtoPackage, serverName, resourceTitle, resourceTitle, resourceTitle, resourceTitle, resourceTitle,
		serverName, resourceTitle, resourceTitle, resourceTitle, resourceTitle, resourceTitle, resourceLower, resourceTitle,
		resourceTitle, resourceTitle, serverName, resourceTitle, resourceTitle, resourceLower, resourceTitle, resourceTitle,
		resourceTitle, resourceTitle, resourceTitle, serverName, resourceTitle, resourceTitle, resourceTitle, resourceTitle,
		resourceTitle, resourceTitle, resourceTitle, resourceTitle, serverName, resourceTitle, resourceTitle,
		resourceTitle, resourceTitle, resourceLower, resourceTitle, resourceLower, params.ResourceNameFormat,
		formatStr, resourceTitle, resourceTitle, resourceLower, params.ResourceNameFormat, serverName,
		resourceTitle, resourceLower, resourceLower, resourceLower, resourceTitle, resourceTitle)
}
