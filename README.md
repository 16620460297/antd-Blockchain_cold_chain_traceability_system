package main

import (
	"back_Blockchain_cold_chain_traceability_system/configs"
	"back_Blockchain_cold_chain_traceability_system/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"log"
	"os"
	"time"
)

func main() {
	// 初始化数据库
	err := configs.InitMySQL()
	if err != nil {
		log.Fatalf("未能初始化 MySQL: %v", err)
	} else {
		log.Println("MySQL 初始化成功")
	}

	// 初始化Redis
	err = configs.InitRedis()
	if err != nil {
		log.Fatalf("未能初始化 Redis。: %v", err)
	} else {
		log.Println("Redis 初始化成功")
	}

	// 初始化上传目录
	ensureDir("./uploads/products")
	ensureDir("./uploads/logistics")

	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	// 创建Gin实例
	r := gin.Default()

	// CORS设置
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 静态文件服务
	r.Static("/uploads", "./uploads")

	// 注册路由
	service.SetupUserRoutes(r)
	service.SetupFactoryRoutes(r)
	service.SetupSalerRoutes(r)
	service.SetupQueryRoutes(r)
	service.SetupBlockchainRoutes(r)
	service.SetupAdminRoutes(r)

	// 初始化管理员账户
	initAdminUser()

	// 获取端口配置
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 启动服务器
	log.Printf("Server starting on port %s...", port)
	err = r.Run("0.0.0.0:" + port)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// 初始化管理员账户
func initAdminUser() {
	var count int64
	configs.DB.Model(&configs.User{}).Where("user_type = 4").Count(&count)
	if count > 0 {
		return
	}

	password, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := configs.User{
		Username:    "admin",
		Password:    string(password),
		RealName:    "系统管理员",
		Address:     "系统",
		Contact:     "admin@system.com",
		UserType:    4,
		AuditStatus: 1,
	}

	result := configs.DB.Create(&admin)
	if result.Error != nil {
		log.Printf("Failed to create admin user: %v", result.Error)
	} else {
		log.Println("Admin user created successfully")
	}
}

// 确保目录存在
func ensureDir(dirPath string) {
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		err = os.MkdirAll(dirPath, 0755)
		if err != nil {
			log.Printf("Failed to create directory %s: %v", dirPath, err)
		}
	}
}
package configs

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"time"
)

type MySQLConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

var GlobalMySQLConfig = MySQLConfig{
	Host:     "localhost",
	Port:     3306,
	User:     "root",
	Password: "MO520MING",
	DBName:   "cold_chain",
}

var DB *gorm.DB

func InitMySQL() error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		GlobalMySQLConfig.User,
		GlobalMySQLConfig.Password,
		GlobalMySQLConfig.Host,
		GlobalMySQLConfig.Port,
		GlobalMySQLConfig.DBName)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(10)           // 设置空闲连接池中连接的最大数量
	sqlDB.SetMaxOpenConns(100)          // 设置打开数据库连接的最大数量
	sqlDB.SetConnMaxLifetime(time.Hour) // 设置了连接可复用的最大时间

	// 自动迁移表结构
	err = AutoMigrateTables()
	if err != nil {
		return err
	}

	return nil
}

// 模型定义
type User struct {
	gorm.Model
	Username    string `gorm:"uniqueIndex;size:50;not null"`
	Password    string `gorm:"size:100;not null"`
	RealName    string `gorm:"size:50;not null"`
	Address     string `gorm:"size:200;not null"`
	Contact     string `gorm:"size:50;not null"`
	UserType    int    `gorm:"not null"` // 1: 厂家, 2: 经销商/店家, 3: 监管方/消费者, 4: 管理员
	CompanyName string `gorm:"size:100"`
	LicenseNo   string `gorm:"size:50"`
	AuditStatus int    `gorm:"default:0"` // 0: 未审核, 1: 已审核通过, 2: 已拒绝
	AuditRemark string
}

type ProductInfo struct {
	gorm.Model
	SKU              string    `gorm:"uniqueIndex;size:50;not null"`
	Name             string    `gorm:"size:100;not null"`
	Brand            string    `gorm:"size:50;not null"`
	Specification    string    `gorm:"size:100;not null"`
	ProductionDate   time.Time `gorm:"not null"`
	ExpirationDate   time.Time `gorm:"not null"`
	BatchNumber      string    `gorm:"size:50;not null"`
	ManufacturerID   uint      `gorm:"not null"`
	MaterialSource   string    `gorm:"size:200;not null"`
	ProcessLocation  string    `gorm:"size:200;not null"`
	ProcessMethod    string    `gorm:"size:200;not null"`
	TransportTemp    float64   `gorm:"not null"`
	StorageCondition string    `gorm:"size:200;not null"`
	SafetyTesting    string    `gorm:"size:500;not null"`
	QualityRating    string    `gorm:"size:50;not null"`
	ImageURL         string    `gorm:"size:500;not null"`
	Status           int       `gorm:"default:0"` // 0: 待审核, 1: 已发布
	AuditRemark      string
}

type LogisticsRecord struct {
	gorm.Model
	ProductSKU        string  `gorm:"size:50;not null;index"`
	TrackingNo        string  `gorm:"size:50;not null"`
	WarehouseLocation string  `gorm:"size:200;not null"`
	Temperature       float64 `gorm:"not null"`
	Humidity          float64 `gorm:"not null"`
	ImageURL          string  `gorm:"size:500;not null"`
	OperatorID        uint    `gorm:"not null"`
	OperatorType      int     `gorm:"not null"` // 1: 厂家, 2: 经销商
}

type TransferRecord struct {
	gorm.Model
	ProductSKU string `gorm:"size:50;not null;index"`
	FromUserID uint   `gorm:"not null"`
	ToUserID   uint   `gorm:"not null"`
	Remarks    string
	Status     int `gorm:"default:0"` // 0: 待确认, 1: 已确认
}

type BlockchainLog struct {
	gorm.Model
	ProductSKU   string `gorm:"size:50;not null;index"`
	RecordType   int    `gorm:"not null"` // 1: 产品创建, 2: 物流更新, 3: 确认交接
	RecordData   string `gorm:"type:text;not null"`
	Hash         string `gorm:"size:256;not null"`
	PreviousHash string `gorm:"size:256"`
	BlockHeight  int64
}

func AutoMigrateTables() error {
	return DB.AutoMigrate(
		&User{},
		&ProductInfo{},
		&LogisticsRecord{},
		&TransferRecord{},
		&BlockchainLog{},
	)
}
package configs

import (
	"context"
	"github.com/redis/go-redis/v9"
	"time"
)

var RedisClient *redis.Client

func InitRedis() error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "000000", // no password set
		DB:       0,        // use default DB
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := RedisClient.Ping(ctx).Result()
	return err
}

// 存储JWT到Redis，设置过期时间
func StoreJWT(userID uint, token string, expiration time.Duration) error {
	ctx := context.Background()
	key := "user:token:" + string(rune(userID))
	return RedisClient.Set(ctx, key, token, expiration).Err()
}

// 从Redis获取JWT
func GetJWT(userID uint) (string, error) {
	ctx := context.Background()
	key := "user:token:" + string(rune(userID))
	return RedisClient.Get(ctx, key).Result()
}

// 删除Redis中的JWT
func DeleteJWT(userID uint) error {
	ctx := context.Background()
	key := "user:token:" + string(rune(userID))
	return RedisClient.Del(ctx, key).Err()
}
package service

import (
	"back_Blockchain_cold_chain_traceability_system/api"
	"back_Blockchain_cold_chain_traceability_system/configs"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"strconv"
)

// AdminService 实现后台管理相关功能
type AdminService struct{}

// AdminUserList 获取用户列表
func (s *AdminService) AdminUserList(c *gin.Context) {
	userType := c.Query("user_type")
	auditStatus := c.Query("audit_status")
	keyword := c.Query("keyword")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	query := configs.DB.Model(&configs.User{})

	// 根据条件筛选
	if userType != "" {
		query = query.Where("user_type = ?", userType)
	}
	if auditStatus != "" {
		query = query.Where("audit_status = ?", auditStatus)
	}
	if keyword != "" {
		query = query.Where("username LIKE ? OR real_name LIKE ? OR company_name LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var users []configs.User
	result := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&users)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询用户列表失败: " + result.Error.Error(),
		})
		return
	}

	// 不返回密码信息
	var responseUsers []gin.H
	for _, user := range users {
		responseUsers = append(responseUsers, gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"real_name":    user.RealName,
			"address":      user.Address,
			"contact":      user.Contact,
			"user_type":    user.UserType,
			"company_name": user.CompanyName,
			"license_no":   user.LicenseNo,
			"audit_status": user.AuditStatus,
			"created_at":   user.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取用户列表成功",
		Data: gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"users":     responseUsers,
		},
	})
}

// AdminProductList 获取产品列表
func (s *AdminService) AdminProductList(c *gin.Context) {
	status := c.Query("status")
	keyword := c.Query("keyword")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	query := configs.DB.Model(&configs.ProductInfo{})

	// 根据条件筛选
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		query = query.Where("name LIKE ? OR brand LIKE ? OR sku LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var products []configs.ProductInfo
	result := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询产品列表失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取产品列表成功",
		Data: gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"products":  products,
		},
	})
}

// AdminAuditUser 审核用户
func (s *AdminService) AdminAuditUser(c *gin.Context) {
	var req api.AuditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	var user configs.User
	result := configs.DB.First(&user, req.ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "用户不存在",
		})
		return
	}

	// 更新审核状态
	user.AuditStatus = req.Status
	user.AuditRemark = req.Remark
	result = configs.DB.Save(&user)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "更新用户审核状态失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "用户审核操作成功",
	})
}

// AdminAuditProduct 审核产品
func (s *AdminService) AdminAuditProduct(c *gin.Context) {
	var req api.AuditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	var product configs.ProductInfo
	result := configs.DB.First(&product, req.ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "产品不存在",
		})
		return
	}

	// 更新审核状态
	product.Status = req.Status
	product.AuditRemark = req.Remark
	result = configs.DB.Save(&product)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "更新产品审核状态失败: " + result.Error.Error(),
		})
		return
	}

	// 如果审核通过，记录到区块链
	if req.Status == 1 {
		blockchainService := &BlockchainService{}
		productData, _ := json.Marshal(product)
		blockchainService.AddToBlockchain(product.SKU, 1, string(productData))
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "产品审核操作成功",
	})
}

// AdminAddUser 添加用户
func (s *AdminService) AdminAddUser(c *gin.Context) {
	var req api.UserRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 检查用户名是否已存在
	var existUser configs.User
	result := configs.DB.Where("username = ?", req.Username).First(&existUser)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "用户名已存在",
		})
		return
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "密码加密失败",
		})
		return
	}

	// 创建用户
	user := configs.User{
		Username:    req.Username,
		Password:    string(hashedPassword),
		RealName:    req.RealName,
		Address:     req.Address,
		Contact:     req.Contact,
		UserType:    req.UserType,
		CompanyName: req.CompanyName,
		LicenseNo:   req.LicenseNo,
		AuditStatus: 1, // 管理员添加直接审核通过
	}

	result = configs.DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "创建用户失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "添加用户成功",
		Data:    user.ID,
	})
}

// AdminDashboard 管理员仪表盘数据
func (s *AdminService) AdminDashboard(c *gin.Context) {
	// 统计用户数据
	var userStats struct {
		TotalUsers       int64 `json:"total_users"`
		PendingUsers     int64 `json:"pending_users"`
		FactoryCount     int64 `json:"factory_count"`
		DistributorCount int64 `json:"distributor_count"`
		ConsumerCount    int64 `json:"consumer_count"`
	}

	configs.DB.Model(&configs.User{}).Count(&userStats.TotalUsers)
	configs.DB.Model(&configs.User{}).Where("audit_status = 0").Count(&userStats.PendingUsers)
	configs.DB.Model(&configs.User{}).Where("user_type = 1").Count(&userStats.FactoryCount)
	configs.DB.Model(&configs.User{}).Where("user_type = 2").Count(&userStats.DistributorCount)
	configs.DB.Model(&configs.User{}).Where("user_type = 3").Count(&userStats.ConsumerCount)

	// 统计产品数据
	var productStats struct {
		TotalProducts   int64 `json:"total_products"`
		PendingProducts int64 `json:"pending_products"`
		ActiveProducts  int64 `json:"active_products"`
	}

	configs.DB.Model(&configs.ProductInfo{}).Count(&productStats.TotalProducts)
	configs.DB.Model(&configs.ProductInfo{}).Where("status = 0").Count(&productStats.PendingProducts)
	configs.DB.Model(&configs.ProductInfo{}).Where("status = 1").Count(&productStats.ActiveProducts)

	// 统计物流数据
	var logisticsCount int64
	configs.DB.Model(&configs.LogisticsRecord{}).Count(&logisticsCount)

	// 统计交接数据
	var transferCount int64
	configs.DB.Model(&configs.TransferRecord{}).Count(&transferCount)

	// 统计区块链数据
	var blockchainCount int64
	configs.DB.Model(&configs.BlockchainLog{}).Count(&blockchainCount)

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取仪表盘数据成功",
		Data: gin.H{
			"user_stats":       userStats,
			"product_stats":    productStats,
			"logistics_count":  logisticsCount,
			"transfer_count":   transferCount,
			"blockchain_count": blockchainCount,
		},
	})
}

// SetupAdminRoutes 设置管理员服务路由
func SetupAdminRoutes(router *gin.Engine) {
	adminService := &AdminService{}

	// 管理员接口
	adminGroup := router.Group("/api/admin")
	adminGroup.Use(AuthMiddleware(), TypeAuthMiddleware(4)) // 仅管理员可访问
	{
		adminGroup.GET("/users", adminService.AdminUserList)
		adminGroup.GET("/products", adminService.AdminProductList)
		adminGroup.POST("/user/audit", adminService.AdminAuditUser)
		adminGroup.POST("/product/audit", adminService.AdminAuditProduct)
		adminGroup.POST("/user/add", adminService.AdminAddUser)
		adminGroup.GET("/dashboard", adminService.AdminDashboard)
	}
}
package service

import (
	"back_Blockchain_cold_chain_traceability_system/configs"
	"crypto/sha256"
	"encoding/hex"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

// BlockchainService 实现区块链相关功能
type BlockchainService struct{}

// 生成哈希值
func generateHash(data string, previousHash string, timestamp time.Time) string {
	h := sha256.New()
	h.Write([]byte(data + previousHash + timestamp.String()))
	return hex.EncodeToString(h.Sum(nil))
}

// AddToBlockchain 添加记录到区块链
func (s *BlockchainService) AddToBlockchain(productSKU string, recordType int, data string) (string, error) {
	// 获取最新的区块哈希作为前一个哈希
	var lastBlock configs.BlockchainLog
	var previousHash string
	var blockHeight int64 = 1 // 默认是第一个区块

	result := configs.DB.Where("product_sku = ?", productSKU).
		Order("created_at DESC").
		First(&lastBlock)

	if result.Error == nil {
		previousHash = lastBlock.Hash
		blockHeight = lastBlock.BlockHeight + 1
	}

	// 生成当前区块哈希
	timestamp := time.Now()
	hash := generateHash(data, previousHash, timestamp)

	// 创建区块记录
	block := configs.BlockchainLog{
		ProductSKU:   productSKU,
		RecordType:   recordType,
		RecordData:   data,
		Hash:         hash,
		PreviousHash: previousHash,
		BlockHeight:  blockHeight,
	}

	result = configs.DB.Create(&block)
	if result.Error != nil {
		return "", result.Error
	}

	return hash, nil
}

// VerifyBlockchain 验证区块链完整性
func (s *BlockchainService) VerifyBlockchain(c *gin.Context) {
	productSKU := c.Query("sku")
	if productSKU == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请提供产品SKU",
		})
		return
	}

	// 查询所有区块
	var blocks []configs.BlockchainLog
	result := configs.DB.Where("product_sku = ?", productSKU).
		Order("created_at").
		Find(&blocks)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询区块链记录失败",
		})
		return
	}

	if len(blocks) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "未找到区块链记录",
		})
		return
	}

	// 验证每个区块
	valid := true
	invalidBlock := 0
	var previousHash string

	for i, block := range blocks {
		if i == 0 {
			// 第一个区块，检查前置哈希是否为空
			if block.PreviousHash != "" {
				valid = false
				invalidBlock = i + 1
				break
			}
		} else {
			// 检查前置哈希是否匹配
			if block.PreviousHash != previousHash {
				valid = false
				invalidBlock = i + 1
				break
			}
		}

		// 检查哈希值是否正确
		calculatedHash := generateHash(block.RecordData, block.PreviousHash, block.CreatedAt)
		if calculatedHash != block.Hash {
			valid = false
			invalidBlock = i + 1
			break
		}

		previousHash = block.Hash
	}

	if valid {
		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "区块链验证通过",
			"data": gin.H{
				"valid":        true,
				"total_blocks": len(blocks),
			},
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "区块链验证失败",
			"data": gin.H{
				"valid":         false,
				"invalid_block": invalidBlock,
				"total_blocks":  len(blocks),
				// 续上段代码
			},
		})
	}
}

// GetBlockchainData 获取区块链数据
func (s *BlockchainService) GetBlockchainData(c *gin.Context) {
	productSKU := c.Query("sku")
	if productSKU == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请提供产品SKU",
		})
		return
	}

	// 查询所有区块
	var blocks []configs.BlockchainLog
	result := configs.DB.Where("product_sku = ?", productSKU).
		Order("created_at ASC").
		Find(&blocks)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询区块链记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "获取区块链数据成功",
		"data":    blocks,
	})
}

// SetupBlockchainRoutes 设置区块链服务路由
func SetupBlockchainRoutes(router *gin.Engine) {
	blockchainService := &BlockchainService{}

	// 公开接口
	publicGroup := router.Group("/api/blockchain")
	{
		publicGroup.GET("/verify", blockchainService.VerifyBlockchain)
		publicGroup.GET("/data", blockchainService.GetBlockchainData)
	}
}
package service

import (
	"back_Blockchain_cold_chain_traceability_system/api"
	"back_Blockchain_cold_chain_traceability_system/configs"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

// FactoryService 实现厂家相关功能
type FactoryService struct{}

// AddProduct 添加冷冻品
func (s *FactoryService) AddProduct(c *gin.Context) {
	userID, _ := c.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "未登录",
		})
		return
	}

	var req api.AddProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 解析日期
	productionDate, err := time.Parse("2006-01-02", req.ProductionDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "生产日期格式错误，应为YYYY-MM-DD",
		})
		return
	}

	expirationDate, err := time.Parse("2006-01-02", req.ExpirationDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "保质期格式错误，应为YYYY-MM-DD",
		})
		return
	}

	// 生成SKU码
	manufacturerID := userID.(uint)
	timeStr := time.Now().Format("20060102150405")
	uuidStr := uuid.New().String()[:8]
	sku := fmt.Sprintf("P%s%s%s", strconv.FormatUint(uint64(manufacturerID), 10), timeStr, uuidStr)

	// 保存图片
	imageURL := ""
	if req.ImageBase64 != "" {
		// 确保上传目录存在
		uploadDir := "./uploads/products"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, api.Response{
				Code:    500,
				Message: "创建上传目录失败",
			})
			return
		}

		// 解码Base64图片
		imageData, err := base64.StdEncoding.DecodeString(req.ImageBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, api.Response{
				Code:    400,
				Message: "图片格式错误",
			})
			return
		}

		// 保存图片
		filename := sku + ".jpg"
		filePath := filepath.Join(uploadDir, filename)
		if err := os.WriteFile(filePath, imageData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, api.Response{
				Code:    500,
				Message: "保存图片失败",
			})
			return
		}

		// 设置图片URL
		imageURL = "/uploads/products/" + filename
	}

	// 创建产品记录
	product := configs.ProductInfo{
		SKU:              sku,
		Name:             req.Name,
		Brand:            req.Brand,
		Specification:    req.Specification,
		ProductionDate:   productionDate,
		ExpirationDate:   expirationDate,
		BatchNumber:      req.BatchNumber,
		ManufacturerID:   manufacturerID,
		MaterialSource:   req.MaterialSource,
		ProcessLocation:  req.ProcessLocation,
		ProcessMethod:    req.ProcessMethod,
		TransportTemp:    req.TransportTemp,
		StorageCondition: req.StorageCondition,
		SafetyTesting:    req.SafetyTesting,
		QualityRating:    req.QualityRating,
		ImageURL:         imageURL,
		Status:           0, // 默认待审核
	}

	result := configs.DB.Create(&product)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "创建产品失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "添加产品成功，请等待审核",
		Data: gin.H{
			"product_id": product.ID,
			"sku":        product.SKU,
		},
	})
}

// GetProductList 获取厂家的产品列表
func (s *FactoryService) GetProductList(c *gin.Context) {
	userID, _ := c.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "未登录",
		})
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	// 查询过滤
	status := c.Query("status")
	statusFilter := ""
	if status != "" {
		statusFilter = "status = " + status
	}

	// 查询产品列表
	var products []configs.ProductInfo
	query := configs.DB.Where("manufacturer_id = ?", userID)
	if statusFilter != "" {
		query = query.Where(statusFilter)
	}

	var total int64
	query.Model(&configs.ProductInfo{}).Count(&total)

	result := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&products)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询产品列表失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取产品列表成功",
		Data: gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"products": products,
		},
	})
}

// ConfirmTransfer 确认产品交接
func (s *FactoryService) ConfirmTransfer(c *gin.Context) {
	userID, _ := c.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "未登录",
		})
		return
	}

	var req api.TransferConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 检查产品是否存在且是当前用户的
	var product configs.ProductInfo
	result := configs.DB.Where("sku = ? AND manufacturer_id = ?", req.ProductSKU, userID).First(&product)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "产品不存在或不属于当前用户",
		})
		return
	}

	// 续上段代码
	// 检查产品是否已发布
	if product.Status != 1 {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "产品尚未审核通过，无法确认交接",
		})
		return
	}

	// 检查目标用户是否存在且是经销商
	var toUser configs.User
	result = configs.DB.Where("id = ? AND user_type = 2", req.ToUserID).First(&toUser)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "目标用户不存在或不是经销商",
		})
		return
	}

	// 创建交接记录
	transfer := configs.TransferRecord{
		ProductSKU: req.ProductSKU,
		FromUserID: userID.(uint),
		ToUserID:   req.ToUserID,
		Remarks:    req.Remarks,
		Status:     1, // 厂家直接确认
	}

	result = configs.DB.Create(&transfer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "创建交接记录失败: " + result.Error.Error(),
		})
		return
	}

	// 记录到区块链
	blockchainService := &BlockchainService{}
	transferData, _ := json.Marshal(transfer)
	blockchainService.AddToBlockchain(req.ProductSKU, 3, string(transferData))

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "确认交接成功",
		Data:    transfer.ID,
	})
}

// UpdateProduct 更新产品信息
func (s *FactoryService) UpdateProduct(c *gin.Context) {
	userID, _ := c.Get("userID")
	productID := c.Param("id")

	var product configs.ProductInfo
	result := configs.DB.Where("id = ? AND manufacturer_id = ?", productID, userID).First(&product)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "产品不存在或不属于当前用户",
		})
		return
	}

	// 只有待审核状态的产品才能更新
	if product.Status != 0 {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "只有待审核的产品才能更新",
		})
		return
	}

	var updateData api.AddProductRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 更新基本信息
	if updateData.Name != "" {
		product.Name = updateData.Name
	}
	if updateData.Brand != "" {
		product.Brand = updateData.Brand
	}
	if updateData.Specification != "" {
		product.Specification = updateData.Specification
	}
	if updateData.BatchNumber != "" {
		product.BatchNumber = updateData.BatchNumber
	}
	if updateData.MaterialSource != "" {
		product.MaterialSource = updateData.MaterialSource
	}
	if updateData.ProcessLocation != "" {
		product.ProcessLocation = updateData.ProcessLocation
	}
	if updateData.ProcessMethod != "" {
		product.ProcessMethod = updateData.ProcessMethod
	}
	if updateData.TransportTemp != 0 {
		product.TransportTemp = updateData.TransportTemp
	}
	if updateData.StorageCondition != "" {
		product.StorageCondition = updateData.StorageCondition
	}
	if updateData.SafetyTesting != "" {
		product.SafetyTesting = updateData.SafetyTesting
	}
	if updateData.QualityRating != "" {
		product.QualityRating = updateData.QualityRating
	}

	// 处理日期
	if updateData.ProductionDate != "" {
		productionDate, err := time.Parse("2006-01-02", updateData.ProductionDate)
		if err == nil {
			product.ProductionDate = productionDate
		}
	}
	if updateData.ExpirationDate != "" {
		expirationDate, err := time.Parse("2006-01-02", updateData.ExpirationDate)
		if err == nil {
			product.ExpirationDate = expirationDate
		}
	}

	// 处理图片更新
	if updateData.ImageBase64 != "" {
		// 确保上传目录存在
		uploadDir := "./uploads/products"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, api.Response{
				Code:    500,
				Message: "创建上传目录失败",
			})
			return
		}

		// 删除旧图片（如果存在）
		if product.ImageURL != "" {
			oldImagePath := "." + product.ImageURL
			if _, err := os.Stat(oldImagePath); err == nil {
				os.Remove(oldImagePath)
			}
		}

		// 解码并保存新图片
		imageData, err := base64.StdEncoding.DecodeString(updateData.ImageBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, api.Response{
				Code:    400,
				Message: "图片格式错误",
			})
			return
		}

		filename := product.SKU + "_" + strconv.FormatInt(time.Now().Unix(), 10) + ".jpg"
		filePath := filepath.Join(uploadDir, filename)
		if err := os.WriteFile(filePath, imageData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, api.Response{
				Code:    500,
				Message: "保存图片失败",
			})
			return
		}

		product.ImageURL = "/uploads/products/" + filename
	}

	// 保存更新
	result = configs.DB.Save(&product)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "更新产品失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "更新产品成功",
	})
}

// GetPendingTransfers 获取待确认的交接记录
func (s *FactoryService) GetPendingTransfers(c *gin.Context) {
	userID, _ := c.Get("userID")

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	var transfers []struct {
		configs.TransferRecord
		ProductName  string `json:"product_name"`
		FromUsername string `json:"from_username"`
		ToUsername   string `json:"to_username"`
	}

	// 查询待确认的交接记录
	query := configs.DB.Table("transfer_records").
		Select("transfer_records.*, p.name as product_name, u1.username as from_username, u2.username as to_username").
		Joins("JOIN product_infos p ON transfer_records.product_sku = p.sku").
		Joins("JOIN users u1 ON transfer_records.from_user_id = u1.id").
		Joins("JOIN users u2 ON transfer_records.to_user_id = u2.id").
		Where("(from_user_id = ? OR to_user_id = ?) AND status = 0", userID, userID)

	var total int64
	query.Count(&total)

	result := query.Order("transfer_records.created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&transfers)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询交接记录失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取待确认交接记录成功",
		Data: gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"transfers": transfers,
		},
	})
}

// SetupFactoryRoutes 设置厂家服务路由
func SetupFactoryRoutes(router *gin.Engine) {
	factoryService := &FactoryService{}

	factoryGroup := router.Group("/api/factory")
	factoryGroup.Use(AuthMiddleware(), TypeAuthMiddleware(1)) // 仅厂家可访问
	{
		factoryGroup.POST("/product", factoryService.AddProduct)
		factoryGroup.GET("/products", factoryService.GetProductList)
		factoryGroup.PUT("/product/:id", factoryService.UpdateProduct)
		factoryGroup.POST("/transfer/confirm", factoryService.ConfirmTransfer)
		factoryGroup.GET("/transfers/pending", factoryService.GetPendingTransfers)
	}
}
package service

import (
	"back_Blockchain_cold_chain_traceability_system/api"
	"back_Blockchain_cold_chain_traceability_system/configs"
	"github.com/gin-gonic/gin"
	"net/http"
)

// QueryService 实现查询相关功能
type QueryService struct{}

// TraceProduct 追溯产品信息
func (s *QueryService) TraceProduct(c *gin.Context) {
	sku := c.Query("sku")
	if sku == "" {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请提供产品SKU",
		})
		return
	}

	// 查询产品基本信息
	var product configs.ProductInfo
	result := configs.DB.Where("sku = ? AND status = 1", sku).First(&product)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "产品不存在或未上架",
		})
		return
	}

	// 查询物流信息
	var logistics []struct {
		configs.LogisticsRecord
		OperatorName string `json:"operator_name"`
		OperatorType string `json:"operator_type_name"`
	}

	result = configs.DB.Table("logistics_records").
		Select("logistics_records.*, users.real_name as operator_name, CASE logistics_records.operator_type WHEN 1 THEN '厂家' WHEN 2 THEN '经销商' ELSE '未知' END as operator_type_name").
		Joins("JOIN users ON logistics_records.operator_id = users.id").
		Where("logistics_records.product_sku = ?", sku).
		Order("logistics_records.created_at").
		Find(&logistics)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询物流信息失败: " + result.Error.Error(),
		})
		return
	}

	// 查询区块链记录
	var blockchain []configs.BlockchainLog
	result = configs.DB.Where("product_sku = ?", sku).
		Order("created_at").
		Find(&blockchain)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询区块链记录失败: " + result.Error.Error(),
		})
		return
	}

	// 查询生产商信息
	var manufacturer configs.User
	result = configs.DB.Select("id, real_name, company_name, address, contact").
		Where("id = ?", product.ManufacturerID).
		First(&manufacturer)

	// 查询交接记录
	var transfers []struct {
		configs.TransferRecord
		FromUserName string `json:"from_user_name"`
		ToUserName   string `json:"to_user_name"`
	}

	result = configs.DB.Table("transfer_records").
		Select("transfer_records.*, u1.real_name as from_user_name, u2.real_name as to_user_name").
		Joins("JOIN users u1 ON transfer_records.from_user_id = u1.id").
		Joins("JOIN users u2 ON transfer_records.to_user_id = u2.id").
		Where("transfer_records.product_sku = ? AND transfer_records.status = 1", sku).
		Order("transfer_records.created_at").
		Find(&transfers)

	// 构造溯源信息返回
	traceInfo := gin.H{
		"product": gin.H{
			"sku":               product.SKU,
			"name":              product.Name,
			"brand":             product.Brand,
			"specification":     product.Specification,
			"production_date":   product.ProductionDate.Format("2006-01-02"),
			"expiration_date":   product.ExpirationDate.Format("2006-01-02"),
			"batch_number":      product.BatchNumber,
			"material_source":   product.MaterialSource,
			"process_location":  product.ProcessLocation,
			"process_method":    product.ProcessMethod,
			"transport_temp":    product.TransportTemp,
			"storage_condition": product.StorageCondition,
			"safety_testing":    product.SafetyTesting,
			"quality_rating":    product.QualityRating,
			"image_url":         product.ImageURL,
			"manufacturer":      manufacturer,
		},
		"logistics":  logistics,
		"transfers":  transfers,
		"blockchain": blockchain,
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取产品溯源信息成功",
		Data:    traceInfo,
	})
}

// VerifyProduct 验证产品真伪
func (s *QueryService) VerifyProduct(c *gin.Context) {
	sku := c.Query("sku")
	if sku == "" {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请提供产品SKU",
		})
		return
	}

	// 查询区块链记录
	var blockchainCount int64
	result := configs.DB.Model(&configs.BlockchainLog{}).
		Where("product_sku = ?", sku).
		Count(&blockchainCount)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "验证产品失败: " + result.Error.Error(),
		})
		return
	}

	// 查询产品是否存在
	var productCount int64
	result = configs.DB.Model(&configs.ProductInfo{}).
		Where("sku = ? AND status = 1", sku).
		Count(&productCount)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "验证产品失败: " + result.Error.Error(),
		})
		return
	}

	if productCount == 0 {
		c.JSON(http.StatusOK, api.Response{
			Code:    200,
			Message: "验证完成",
			Data: gin.H{
				"authentic": false,
				"message":   "产品不存在或未上架",
			},
		})
		return
	}

	if blockchainCount == 0 {
		c.JSON(http.StatusOK, api.Response{
			Code:    200,
			Message: "验证完成",
			Data: gin.H{
				"authentic": false,
				"message":   "产品没有区块链记录，可能是假冒产品",
			},
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "验证完成",
		Data: gin.H{
			"authentic": true,
			"message":   "产品验证通过，是正品",
		},
	})
}

// SetupQueryRoutes 设置查询服务路由
func SetupQueryRoutes(router *gin.Engine) {
	queryService := &QueryService{}

	// 公开接口，不需要身份验证
	publicGroup := router.Group("/api/query")
	{
		publicGroup.GET("/trace", queryService.TraceProduct)
		publicGroup.GET("/verify", queryService.VerifyProduct)
	}

	// 需要身份验证的接口，监管方和消费者可访问
	authGroup := router.Group("/api/query")
	authGroup.Use(AuthMiddleware(), TypeAuthMiddleware(3))
	{
		// 如果有需要特殊权限的接口，可以放这里
	}
}
package service

import (
	"back_Blockchain_cold_chain_traceability_system/api"
	"back_Blockchain_cold_chain_traceability_system/configs"
	"encoding/base64"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

// SalerService 实现经销商相关功能
type SalerService struct{}

// SearchFactories 搜索厂家
func (s *SalerService) SearchFactories(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "搜索关键词不能为空",
		})
		return
	}

	// 查询已审核通过的厂家
	var factories []configs.User
	result := configs.DB.Where("(username LIKE ? OR real_name LIKE ? OR company_name LIKE ?) AND user_type = 1 AND audit_status = 1",
		"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%").
		Select("id, username, real_name, company_name, address, contact").
		Limit(10).
		Find(&factories)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "搜索厂家失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "搜索厂家成功",
		Data:    factories,
	})
}

// SearchDistributors 搜索经销商
func (s *SalerService) SearchDistributors(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "搜索关键词不能为空",
		})
		return
	}

	// 查询已审核通过的经销商
	var distributors []configs.User
	result := configs.DB.Where("(username LIKE ? OR real_name LIKE ? OR company_name LIKE ?) AND user_type = 2 AND audit_status = 1",
		"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%").
		Select("id, username, real_name, company_name, address, contact").
		Limit(10).
		Find(&distributors)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "搜索经销商失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "搜索经销商成功",
		Data:    distributors,
	})
}

// SearchProducts 搜索产品
func (s *SalerService) SearchProducts(c *gin.Context) {
	keyword := c.Query("keyword")
	factoryID := c.Query("factory_id")

	// 至少需要一个搜索条件
	if keyword == "" && factoryID == "" {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请提供搜索关键词或厂家ID",
		})
		return
	}

	// 构建查询
	query := configs.DB.Model(&configs.ProductInfo{}).Where("status = 1") // 只查询已上架的产品

	if keyword != "" {
		query = query.Where("name LIKE ? OR brand LIKE ? OR sku LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	if factoryID != "" {
		query = query.Where("manufacturer_id = ?", factoryID)
	}

	// 执行查询
	var products []configs.ProductInfo
	result := query.Limit(10).Find(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "搜索产品失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "搜索产品成功",
		Data:    products,
	})
}

// AddLogistics 添加物流信息
func (s *SalerService) AddLogistics(c *gin.Context) {
	userID, _ := c.Get("userID")
	userType, _ := c.Get("userType")

	var req api.LogisticsInfo
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 检查产品是否存在
	var product configs.ProductInfo
	result := configs.DB.Where("sku = ? AND status = 1", req.ProductSKU).First(&product)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "产品不存在或未上架",
		})
		return
	}

	// 处理图片
	imageURL := ""
	if req.ImageBase64 != "" {
		// 确保上传目录存在
		uploadDir := "./uploads/logistics"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, api.Response{
				Code:    500,
				Message: "创建上传目录失败",
			})
			return
		}

		// 解码Base64图片
		imageData, err := base64.StdEncoding.DecodeString(req.ImageBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, api.Response{
				Code:    400,
				Message: "图片格式错误",
			})
			return
		}

		// 保存图片
		filename := req.ProductSKU + "_" + strconv.FormatInt(time.Now().Unix(), 10) + ".jpg"
		filePath := filepath.Join(uploadDir, filename)
		if err := os.WriteFile(filePath, imageData, 0644); err != nil {
			c.JSON(http.StatusInternalServerError, api.Response{
				Code:    500,
				Message: "保存图片失败",
			})
			return
		}

		imageURL = "/uploads/logistics/" + filename
	}

	// 创建物流记录
	logistics := configs.LogisticsRecord{
		ProductSKU:        req.ProductSKU,
		TrackingNo:        req.TrackingNo,
		WarehouseLocation: req.WarehouseLocation,
		Temperature:       req.Temperature,
		Humidity:          req.Humidity,
		ImageURL:          imageURL,
		OperatorID:        userID.(uint),
		OperatorType:      userType.(int),
	}

	result = configs.DB.Create(&logistics)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "创建物流记录失败: " + result.Error.Error(),
		})
		return
	}

	// 记录到区块链
	blockchainService := &BlockchainService{}
	logisticsData, _ := json.Marshal(logistics)
	blockchainService.AddToBlockchain(req.ProductSKU, 2, string(logisticsData))

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "添加物流信息成功",
		Data:    logistics.ID,
	})
}

// ConfirmTransfer 确认产品交接
func (s *SalerService) ConfirmTransfer(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req api.TransferConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 检查产品是否存在
	var product configs.ProductInfo
	result := configs.DB.Where("sku = ? AND status = 1", req.ProductSKU).First(&product)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "产品不存在或未上架",
		})
		return
	}

	// 检查目标用户是否存在且是经销商
	var toUser configs.User
	result = configs.DB.Where("id = ? AND user_type = 2 AND audit_status = 1", req.ToUserID).First(&toUser)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "目标用户不存在或不是已审核的经销商",
		})
		return
	}

	// 创建交接记录
	transfer := configs.TransferRecord{
		ProductSKU: req.ProductSKU,
		FromUserID: userID.(uint),
		ToUserID:   req.ToUserID,
		Remarks:    req.Remarks,
		Status:     1, // 直接确认
	}

	result = configs.DB.Create(&transfer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "创建交接记录失败: " + result.Error.Error(),
		})
		return
	}

	// 记录到区块链
	blockchainService := &BlockchainService{}
	transferData, _ := json.Marshal(transfer)
	blockchainService.AddToBlockchain(req.ProductSKU, 3, string(transferData))

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "确认交接成功",
		Data:    transfer.ID,
	})
}

// GetProductList 获取经销商关联的产品列表
func (s *SalerService) GetProductList(c *gin.Context) {
	userID, _ := c.Get("userID")

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	// 查询经销商接收的所有产品
	var productSKUs []string
	result := configs.DB.Model(&configs.TransferRecord{}).
		Where("to_user_id = ? AND status = 1", userID).
		Distinct("product_sku").
		Pluck("product_sku", &productSKUs)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询产品失败: " + result.Error.Error(),
		})
		return
	}

	if len(productSKUs) == 0 {
		c.JSON(http.StatusOK, api.Response{
			Code:    200,
			Message: "获取产品列表成功",
			Data: gin.H{
				"total":    0,
				"page":     page,
				"pageSize": pageSize,
				"products": []interface{}{},
			},
		})
		return
	}

	// 查询这些产品的详细信息
	var products []configs.ProductInfo
	var total int64
	result = configs.DB.Model(&configs.ProductInfo{}).
		Where("sku IN ? AND status = 1", productSKUs).
		Count(&total)

	result = configs.DB.Where("sku IN ? AND status = 1", productSKUs).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&products)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询产品列表失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取产品列表成功",
		Data: gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"products": products,
		},
	})
}

// GetLogisticsList 获取产品的物流记录
func (s *SalerService) GetLogisticsList(c *gin.Context) {
	productSKU := c.Query("sku")
	if productSKU == "" {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请提供产品SKU",
		})
		return
	}

	var logistics []struct {
		configs.LogisticsRecord
		OperatorName string `json:"operator_name"`
	}

	result := configs.DB.Table("logistics_records").
		Select("logistics_records.*, users.real_name as operator_name").
		Joins("JOIN users ON logistics_records.operator_id = users.id").
		Where("logistics_records.product_sku = ?", productSKU).
		Order("logistics_records.created_at DESC").
		Find(&logistics)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "查询物流记录失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取物流记录成功",
		Data:    logistics,
	})
}

// SetupSalerRoutes 设置经销商服务路由
func SetupSalerRoutes(router *gin.Engine) {
	salerService := &SalerService{}

	salerGroup := router.Group("/api/saler")
	salerGroup.Use(AuthMiddleware(), TypeAuthMiddleware(2)) // 仅经销商可访问
	{
		salerGroup.GET("/factory/search", salerService.SearchFactories)
		salerGroup.GET("/distributor/search", salerService.SearchDistributors)
		salerGroup.GET("/product/search", salerService.SearchProducts)
		salerGroup.POST("/logistics", salerService.AddLogistics)
		salerGroup.POST("/transfer/confirm", salerService.ConfirmTransfer)
		salerGroup.GET("/products", salerService.GetProductList)
		salerGroup.GET("/logistics/list", salerService.GetLogisticsList)
	}
}
package service

import (
	"back_Blockchain_cold_chain_traceability_system/api"
	"back_Blockchain_cold_chain_traceability_system/configs"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"time"
)

// JWT密钥
var jwtKey = []byte("cold_chain_secret_key")

// 自定义JWT声明结构
type Claims struct {
	UserID   uint
	Username string
	UserType int
	jwt.RegisteredClaims
}

// UserService 实现用户相关功能
type UserService struct{}

// Register 用户注册
func (s *UserService) Register(c *gin.Context) {
	var req api.UserRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 检查用户名是否已存在
	var existUser configs.User
	result := configs.DB.Where("username = ?", req.Username).First(&existUser)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "用户名已存在",
		})
		return
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "密码加密失败",
		})
		return
	}

	// 创建用户
	user := configs.User{
		Username:    req.Username,
		Password:    string(hashedPassword),
		RealName:    req.RealName,
		Address:     req.Address,
		Contact:     req.Contact,
		UserType:    req.UserType,
		CompanyName: req.CompanyName,
		LicenseNo:   req.LicenseNo,
		AuditStatus: 0, // 默认未审核
	}

	// 如果是普通消费者，自动审核通过
	if req.UserType == 3 {
		user.AuditStatus = 1
	}

	result = configs.DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "创建用户失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "注册成功，请等待审核",
		Data:    user.ID,
	})
}

// Login 用户登录
func (s *UserService) Login(c *gin.Context) {
	var req api.UserLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 查找用户
	var user configs.User
	result := configs.DB.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "用户名或密码错误",
		})
		return
	}

	// 验证密码
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "用户名或密码错误",
		})
		return
	}

	// 生成JWT Token
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		UserType: user.UserType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "生成token失败",
		})
		return
	}

	// 存储到Redis
	err = configs.StoreJWT(user.ID, tokenString, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "存储token失败",
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "登录成功",
		Data: api.UserLoginResponse{
			Token:       tokenString,
			UserID:      user.ID,
			Username:    user.Username,
			UserType:    user.UserType,
			RealName:    user.RealName,
			AuditStatus: user.AuditStatus,
		},
	})
}

// Logout 用户退出登录
func (s *UserService) Logout(c *gin.Context) {
	userID, _ := c.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "未登录",
		})
		return
	}

	// 从Redis删除token
	err := configs.DeleteJWT(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "退出登录失败",
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "退出登录成功",
	})
}

// GetUserInfo 获取用户信息
func (s *UserService) GetUserInfo(c *gin.Context) {
	userID, _ := c.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "未登录",
		})
		return
	}

	var user configs.User
	result := configs.DB.Where("id = ?", userID).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "用户不存在",
		})
		return
	}

	// 不返回密码等敏感信息
	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "获取用户信息成功",
		Data: gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"real_name":    user.RealName,
			"address":      user.Address,
			"contact":      user.Contact,
			"user_type":    user.UserType,
			"company_name": user.CompanyName,
			"license_no":   user.LicenseNo,
			"audit_status": user.AuditStatus,
			"created_at":   user.CreatedAt,
		},
	})
}

// UpdateUserInfo 更新用户信息
func (s *UserService) UpdateUserInfo(c *gin.Context) {
	userID, _ := c.Get("userID")
	if userID == nil {
		c.JSON(http.StatusUnauthorized, api.Response{
			Code:    401,
			Message: "未登录",
		})
		return
	}

	var updateData struct {
		RealName    string `json:"real_name"`
		Address     string `json:"address"`
		Contact     string `json:"contact"`
		CompanyName string `json:"company_name"`
		LicenseNo   string `json:"license_no"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, api.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	var user configs.User
	result := configs.DB.Where("id = ?", userID).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, api.Response{
			Code:    404,
			Message: "用户不存在",
		})
		return
	}

	// 更新字段
	if updateData.RealName != "" {
		user.RealName = updateData.RealName
	}
	if updateData.Address != "" {
		user.Address = updateData.Address
	}
	if updateData.Contact != "" {
		user.Contact = updateData.Contact
	}
	if updateData.CompanyName != "" {
		user.CompanyName = updateData.CompanyName
	}
	if updateData.LicenseNo != "" {
		user.LicenseNo = updateData.LicenseNo
	}

	result = configs.DB.Save(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, api.Response{
			Code:    500,
			Message: "更新用户信息失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, api.Response{
		Code:    200,
		Message: "更新用户信息成功",
	})
}

// AuthMiddleware JWT认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, api.Response{
				Code:    401,
				Message: "未提供认证令牌",
			})
			c.Abort()
			return
		}

		// 移除"Bearer "前缀（如果有）
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		// 解析JWT
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, api.Response{
				Code:    401,
				Message: "无效的认证令牌",
			})
			c.Abort()
			return
		}

		// 从Redis验证token
		storedToken, err := configs.GetJWT(claims.UserID)
		if err != nil || storedToken != tokenString {
			c.JSON(http.StatusUnauthorized, api.Response{
				Code:    401,
				Message: "无效的认证令牌或已过期",
			})
			c.Abort()
			return
		}

		// 设置用户信息到上下文
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("userType", claims.UserType)

		c.Next()
	}
}

// TypeAuthMiddleware 用户类型认证中间件
func TypeAuthMiddleware(allowedTypes ...int) gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("userType")
		if !exists {
			c.JSON(http.StatusUnauthorized, api.Response{
				Code:    401,
				Message: "认证失败",
			})
			c.Abort()
			return
		}

		allowed := false
		for _, t := range allowedTypes {
			if userType.(int) == t {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, api.Response{
				Code:    403,
				Message: "权限不足",
			})
			c.Abort()
			return
		}

		// 检查是否已通过审核
		userID, _ := c.Get("userID")
		var user configs.User
		result := configs.DB.Select("audit_status").Where("id = ?", userID).First(&user)
		if result.Error == nil && user.AuditStatus != 1 {
			c.JSON(http.StatusForbidden, api.Response{
				Code:    403,
				Message: "账号尚未通过审核",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// SetupUserRoutes 设置用户服务路由
func SetupUserRoutes(router *gin.Engine) {
	userService := &UserService{}

	userGroup := router.Group("/api/user")
	{
		userGroup.POST("/register", userService.Register)
		userGroup.POST("/login", userService.Login)

		// 需要认证的路由
		authGroup := userGroup.Group("/")
		authGroup.Use(AuthMiddleware())
		{
			authGroup.POST("/logout", userService.Logout)
			authGroup.GET("/info", userService.GetUserInfo)
			authGroup.PUT("/info", userService.UpdateUserInfo)
		}
	}
}
