const { ccclass, property, executionOrder } = cc._decorator;
@ccclass
@executionOrder(-99)
export default class ccNode extends cc.Component {
    protected onLoad(): void {
        Object.defineProperty(cc.Node.prototype, 'childComponent', {
            value: function <T extends cc.Component>(component: { prototype: T }, name?: string) {
                let node: cc.Node = name ? this.getChildByName(name) : this.children[0];
                return node.getComponent(component);
            },
            writable: true,
            configurable: true
        });

        Object.defineProperty(cc.Node.prototype, 'childNode', {
            value: function <T extends cc.Component>(name?: string) {
                if (name) {
                    return this.getChildByName(name);
                }else{
                    return this.children[0];
                }
            },
            writable: true,
            configurable: true
        });

        Object.defineProperty(cc.Node.prototype, 'component', {
            get: function () {
                return this.getComponent(cc.Component);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'subContextView', {
            get: function () {
                return this.getComponent(cc.SubContextView);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'wXSubContextView', {
            get: function () {
                return this.getComponent(cc.WXSubContextView);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'swanSubContextView', {
            get: function () {
                return this.getComponent(cc.SwanSubContextView);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'renderComponent', {
            get: function () {
                return this.getComponent(cc.RenderComponent);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'sprite', {
            get: function () {
                return this.getComponent(cc.Sprite);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'widget', {
            get: function () {
                return this.getComponent(cc.Widget);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'camera', {
            get: function () {
                return this.getComponent(cc.Camera);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'canvas', {
            get: function () {
                return this.getComponent(cc.Canvas);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'audioSource', {
            get: function () {
                return this.getComponent(cc.AudioSource);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'animation', {
            get: function () {
                return this.getComponent(cc.Animation);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'button', {
            get: function () {
                return this.getComponent(cc.Button);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'label', {
            get: function () {
                return this.getComponent(cc.Label);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'progressBar', {
            get: function () {
                return this.getComponent(cc.ProgressBar);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'graphics', {
            get: function () {
                return this.getComponent(cc.Graphics);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'mask', {
            get: function () {
                return this.getComponent(cc.Mask);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'scrollbar', {
            get: function () {
                return this.getComponent(cc.Scrollbar);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'viewGroup', {
            get: function () {
                return this.getComponent(cc.ViewGroup);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'scrollView', {
            get: function () {
                return this.getComponent(cc.ScrollView);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'pageViewIndicator', {
            get: function () {
                return this.getComponent(cc.PageViewIndicator);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'pageView', {
            get: function () {
                return this.getComponent(cc.PageView);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'slider', {
            get: function () {
                return this.getComponent(cc.Slider);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'layout', {
            get: function () {
                return this.getComponent(cc.Layout);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'editBox', {
            get: function () {
                return this.getComponent(cc.EditBox);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'labelOutline', {
            get: function () {
                return this.getComponent(cc.LabelOutline);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'labelShadow', {
            get: function () {
                return this.getComponent(cc.LabelShadow);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'richText', {
            get: function () {
                return this.getComponent(cc.RichText);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'toggleContainer', {
            get: function () {
                return this.getComponent(cc.ToggleContainer);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'toggle', {
            get: function () {
                return this.getComponent(cc.Toggle);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'blockInputEvents', {
            get: function () {
                return this.getComponent(cc.BlockInputEvents);
            }
        });

        Object.defineProperty(cc.Node.prototype, 'motionStreak', {
            get: function () {
                return this.getComponent(cc.MotionStreak);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'safeArea', {
            get: function () {
                return this.getComponent(cc.SafeArea);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'collider', {
            get: function () {
                return this.getComponent(cc.Collider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'boxCollider', {
            get: function () {
                return this.getComponent(cc.BoxCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'circleCollider', {
            get: function () {
                return this.getComponent(cc.CircleCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'polygonCollider', {
            get: function () {
                return this.getComponent(cc.PolygonCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'rigidBody', {
            get: function () {
                return this.getComponent(cc.RigidBody);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'physicsCollider', {
            get: function () {
                return this.getComponent(cc.PhysicsCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'physicsChainCollider', {
            get: function () {
                return this.getComponent(cc.PhysicsChainCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'physicsCircleCollider', {
            get: function () {
                return this.getComponent(cc.PhysicsCircleCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'physicsBoxCollider', {
            get: function () {
                return this.getComponent(cc.PhysicsBoxCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'physicsPolygonCollider', {
            get: function () {
                return this.getComponent(cc.PhysicsPolygonCollider);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'joint', {
            get: function () {
                return this.getComponent(cc.Joint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'distanceJoint', {
            get: function () {
                return this.getComponent(cc.DistanceJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'revoluteJoint', {
            get: function () {
                return this.getComponent(cc.RevoluteJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'mouseJoint', {
            get: function () {
                return this.getComponent(cc.MouseJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'motorJoint', {
            get: function () {
                return this.getComponent(cc.MotorJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'prismaticJoint', {
            get: function () {
                return this.getComponent(cc.PrismaticJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'weldJoint', {
            get: function () {
                return this.getComponent(cc.WeldJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'wheelJoint', {
            get: function () {
                return this.getComponent(cc.WheelJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'ropeJoint', {
            get: function () {
                return this.getComponent(cc.RopeJoint);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'meshRenderer', {
            get: function () {
                return this.getComponent(cc.MeshRenderer);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'collider3D', {
            get: function () {
                return this.getComponent(cc.Collider3D);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'boxCollider3D', {
            get: function () {
                return this.getComponent(cc.BoxCollider3D);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'sphereCollider3D', {
            get: function () {
                return this.getComponent(cc.SphereCollider3D);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'rigidBody3D', {
            get: function () {
                return this.getComponent(cc.RigidBody3D);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'constantForce', {
            get: function () {
                return this.getComponent(cc.ConstantForce);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'skeletonAnimation', {
            get: function () {
                return this.getComponent(cc.SkeletonAnimation);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'skinnedMeshRenderer', {
            get: function () {
                return this.getComponent(cc.SkinnedMeshRenderer);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'light', {
            get: function () {
                return this.getComponent(cc.Light);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'particleSystem3D', {
            get: function () {
                return this.getComponent(cc.ParticleSystem3D);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'particleSystem', {
            get: function () {
                return this.getComponent(cc.ParticleSystem);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'tiledLayer', {
            get: function () {
                return this.getComponent(cc.TiledLayer);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'tiledTile', {
            get: function () {
                return this.getComponent(cc.TiledTile);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'tiledObjectGroup', {
            get: function () {
                return this.getComponent(cc.TiledObjectGroup);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'tiledMap', {
            get: function () {
                return this.getComponent(cc.TiledMap);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'videoPlayer', {
            get: function () {
                return this.getComponent(cc.VideoPlayer);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'webView', {
            get: function () {
                return this.getComponent(cc.WebView);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'spine', {
            get: function () {
                return this.getComponent(sp.Skeleton);
            }
        });
        Object.defineProperty(cc.Node.prototype, 'dragonBones', {
            get: function () {
                return this.getComponent(dragonBones.ArmatureDisplay);
            }
        });

        Object.defineProperty(cc.Sprite.prototype, 'setImage', {
            value: function (asset) {
                if (!this.node.originalSize) {
                    this.node.originalSize = new cc.Size(this.node.width, this.node.height);
                }
                this.spriteFrame = asset;
                let size = asset.getOriginalSize();
        
                // 计算节点和图片的宽高比
                let nodeRatio = this.node.originalSize.width / this.node.originalSize.height;
                let spriteRatio = size.width / size.height;
        
                // 根据宽高比来确定节点的新宽高
                if (nodeRatio > spriteRatio) {
                    // 节点相对更宽，根据图片高度适配
                    this.node.width = size.width * (this.node.originalSize.height / size.height);
                    this.node.height = this.node.originalSize.height;
                } else {
                    // 节点相对更高，根据图片宽度适配
                    this.node.width = this.node.originalSize.width;
                    this.node.height = size.height * (this.node.originalSize.width / size.width);
                }
            },
            writable: true,
            configurable: true
        });
    

    }
}
