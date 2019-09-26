package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"

	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
)

// Periodically polls for changes in
// - Deployment
// - Daemonset
// - Statefulset
// - Cronjobs
// Any detected changes is pushed as events
// to Dashboard API.

// Note:
// Status logic is mostly copied from github.com/fluxcd/flux
// and if it turns out to be useful/needed by dashboard, it
// should probably be requested to be added to that project
// instead and exposed as events.

const (
	StatusUnknown  = "unknown"
	StatusError    = "error"
	StatusReady    = "ready"
	StatusUpdating = "updating"
	StatusStarted  = "started"
)

type KubernetesState struct {
	Status  string        `json:"status"`
	Rollout RolloutStatus `json:"rollout"`
}

type RolloutStatus struct {
	// Desired number of pods as defined in spec.
	Desired int32 `json:"desired"`
	// Updated number of pods that are on the desired pod spec.
	Updated int32 `json:"updated"`
	// Ready number of pods targeted by this deployment.
	Ready int32 `json:"ready"`
	// Available number of available pods (ready for at least minReadySeconds) targeted by this deployment.
	Available int32 `json:"available"`
	// Outdated number of pods that are on a different pod spec.
	Outdated int32 `json:"outdated"`
	// Messages about unexpected rollout progress
	// if there's a message here, the rollout will not make progress without intervention
	Messages []string `json:"messages"`
}

type Event struct {
	ID         string          `json:"id"`
	ServiceIDs []string        `json:"serviceIDs"`
	Type       string          `json:"type"`
	StartedAt  time.Time       `json:"startedAt"`
	EndedAt    time.Time       `json:"endedAt"`
	LogLevel   string          `json:"logLevel"`
	Message    string          `json:"message"`
	Metadata   KubernetesState `json:"metadata"`
}

type EventMessage struct {
	Event Event
}

var (
	masterURL          string
	kubeconfig         string
	gitopsDashboardURL string
)

// Please remove me
func main() {
	var err error

	gitopsDashboardURL, err = getEnvStr("DASHBOARD_API", "localhost:3000")
	if err != nil {
		log.Fatalf("Error parsing env var DASHBOARD_API: %s", err.Error())
	}

	if err != nil {
		log.Fatalf("Error parsing env var AZURE_VAULT_MAX_FAILURE_ATTEMPTS: %s", err.Error())
	}

	// https://openbanking-u-aks-836de33c.hcp.westeurope.azmk8s.io
	// /Users/jont/.kube/config
	config, err := clientcmd.BuildConfigFromFlags(masterURL, kubeconfig)
	if err != nil {
		panic(err.Error())
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	factory := informers.NewSharedInformerFactory(clientset, time.Second*10)

	stop := make(chan struct{})
	defer close(stop)

	createDaemonSetInformer(factory)
	createDeploymentInformer(factory)
	createStatefulSetInformer(factory)

	factory.Start(stop)

	for {
		time.Sleep(time.Second)
	}
}

func createDeploymentInformer(factory informers.SharedInformerFactory) cache.SharedIndexInformer {
	informer := factory.Apps().V1().Deployments().Informer()

	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		UpdateFunc: func(oldObj, newObj interface{}) {
			newDeployment := newObj.(*appsv1.Deployment)
			oldDeployment := oldObj.(*appsv1.Deployment)
			if newDeployment.ResourceVersion != oldDeployment.ResourceVersion {
				id := newDeployment.GetNamespace() + ":deployment/" + newDeployment.GetName()

				var status string
				objectMeta, deploymentStatus := newDeployment.ObjectMeta, newDeployment.Status

				status = StatusStarted
				rollout := RolloutStatus{
					Desired:   *newDeployment.Spec.Replicas,
					Updated:   deploymentStatus.UpdatedReplicas,
					Ready:     deploymentStatus.ReadyReplicas,
					Available: deploymentStatus.AvailableReplicas,
					Outdated:  deploymentStatus.Replicas - deploymentStatus.UpdatedReplicas,
					Messages:  deploymentErrors(newDeployment),
				}

				if deploymentStatus.ObservedGeneration >= objectMeta.Generation {
					// the definition has been updated; now let's see about the replicas
					status = StatusUpdating
					if rollout.Updated == rollout.Desired && rollout.Available == rollout.Desired && rollout.Outdated == 0 {
						status = StatusReady
					}
					if len(rollout.Messages) != 0 {
						status = StatusError
					}
				}

				state := KubernetesState{
					Status:  status,
					Rollout: rollout,
				}

				event := EventMessage{
					Event: Event{
						ID:         "1",
						ServiceIDs: []string{id},
						Type:       "kubernetesupdate",
						StartedAt:  time.Now(),
						EndedAt:    time.Now(),
						LogLevel:   "info",
						Message:    "some message",
						Metadata:   state,
					},
				}

				data, err := json.Marshal(event)
				if err != nil {
					fmt.Println("error: ", err)
					return
				}

				fmt.Printf("%s", data)

				res, err := http.Post(gitopsDashboardURL, "application/json", bytes.NewBuffer(data))
				if err != nil {
					fmt.Println("error: ", err)
					return
				}

				fmt.Println()
				fmt.Printf("%s", res.Status)

				// log.Printf("Updated: %s - status: %s", id, status)
			}
		},
	})

	return informer
}

func deploymentErrors(d *appsv1.Deployment) []string {
	var errs []string
	for _, cond := range d.Status.Conditions {
		if (cond.Type == appsv1.DeploymentProgressing && cond.Status == apiv1.ConditionFalse) ||
			(cond.Type == appsv1.DeploymentReplicaFailure && cond.Status == apiv1.ConditionTrue) {
			errs = append(errs, cond.Message)
		}
	}
	return errs
}

func createDaemonSetInformer(factory informers.SharedInformerFactory) cache.SharedIndexInformer {
	informer := factory.Apps().V1().DaemonSets().Informer()

	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		UpdateFunc: func(oldObj, newObj interface{}) {
			newDaemonSet := newObj.(*appsv1.DaemonSet)
			oldDaemonSet := newObj.(*appsv1.DaemonSet)
			if newDaemonSet.ResourceVersion != oldDaemonSet.ResourceVersion {
				id := newDaemonSet.GetNamespace() + ":daemonset/" + newDaemonSet.GetName()
				log.Printf("Updated: %s", id)
			}
		},
	})

	return informer
}

func createStatefulSetInformer(factory informers.SharedInformerFactory) cache.SharedIndexInformer {
	informer := factory.Apps().V1().StatefulSets().Informer()

	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		UpdateFunc: func(oldObj, newObj interface{}) {
			newStatefulSet := newObj.(*appsv1.StatefulSet)
			oldStatefulSet := newObj.(*appsv1.StatefulSet)
			if newStatefulSet.ResourceVersion != oldStatefulSet.ResourceVersion {
				id := newStatefulSet.GetNamespace() + ":statefulset/" + newStatefulSet.GetName()
				log.Printf("Updated: %s", id)
			}
		},
	})

	return informer
}

func getEnvStr(key string, fallback string) (string, error) {
	if value, ok := os.LookupEnv(key); ok {
		return value, nil
	}
	return fallback, nil
}

func init() {
	flag.StringVar(&kubeconfig, "kubeconfig", "", "Path to a kubeconfig. Only required if out-of-cluster.")
	flag.StringVar(&masterURL, "master", "", "The address of the Kubernetes API server. Overrides any value in kubeconfig. Only required if out-of-cluster.")
}
